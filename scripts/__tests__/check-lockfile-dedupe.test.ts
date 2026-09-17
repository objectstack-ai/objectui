/**
 * objectui#8333 — the lockfile-dedupe gate, pinned against the thing it exists
 * to prevent and against the ways it could be worthless.
 *
 * ## ⛔ Nothing in this file may take a LIVE reading (objectui#9562)
 *
 * This file runs in the `unit` vitest project, which `ci.yml` shards four ways
 * as `Test (shard N/4)` — and all four shards are REQUIRED contexts in
 * `scripts/dependabot-merge-gate.mjs`. A required context may only carry
 * readings that are a function of the repository's own bytes.
 *
 * `scripts/check-lockfile-dedupe.mjs` is not such a reading and never was: it
 * shells out to `pnpm dedupe --check`, which resolves against
 * `registry.npmjs.org`. Its own header says so, and `lockfile-dedupe.yml` is
 * built around it — that workflow is PATH-FILTERED precisely so the live
 * reading reaches only the pull requests that can change its subject, which
 * under objectui#3523's rule is also what keeps it out of the required set.
 *
 * Until objectui#9562 this file ran that same live command TWICE on every pull
 * request, inside a required context, bypassing the filter that was put there
 * to bound it. Measured on objectui#9562, holding the lockfile blob fixed
 * (sha256 identical before and after every leg) and varying only what sits
 * outside the repository:
 *
 *   - warm metadata cache, cold cache, and both half-populated states
 *     (pnpm keeps abbreviated and full packuments in SEPARATE caches):
 *     exit 0, `VERDICT deduped`, four for four;
 *   - the same bytes with the registry unreachable: exit 2,
 *     `VERDICT could not take a reading` — which the checker documents as
 *     "never a pass", so the required context reds.
 *
 * ⇒ byte-identical repository input, two different verdicts, decided by a term
 * the repository does not contain. ⚠️ That reproduces the CLASS objectui#9562
 * reported, ⛔ not the specific red it recorded (that one printed
 * `VERDICT not deduped`, and its mechanism is still unidentified — ⛔ do not
 * adopt one here).
 *
 * So the live reading stays where this repository already put it — the
 * path-filtered `Lockfile Dedupe Check` context, still BLOCKING, unchanged —
 * and this file drives the shipped script through a STUBBED `pnpm` instead.
 * ⛔ Do not reintroduce a bare spawn of the checker here: every run below
 * asserts the stub served it (`pnpmArgv` is written by the stub and by nothing
 * else), so a spawn that reached the real pnpm fails rather than going quiet.
 *
 * ## What this file covers that the checker's `--self-test` cannot
 *
 *   1. the self-test really passes, run as shipped rather than re-implemented;
 *   2. `main()` end to end — the exit-code mapping, the annotations, and the
 *      `dedupe --check` argv that is WHY the checker cannot rewrite the
 *      lockfile it judges. ⭐ The live legs this replaced only ever exercised
 *      the GREEN path; the red and could-not-run paths through `main()` had no
 *      coverage at all;
 *   3. it is WIRED — a workflow runs it, that workflow is path-filtered (so it
 *      cannot be REQUIRED under objectui#3523's rule), and the Dependabot merge
 *      gate classifies the check it produces as BLOCKING.
 *
 * ⚠️ (3) is the half that rots silently. The partition test in
 * `dependabot-merge-gate.test.ts` already fails if the name is classified
 * NOWHERE — but it passes just as happily if a future change moves the name
 * into `NOT_A_GATE`, which would turn this gate into an alarm without anything
 * going red. That demotion is a real option and the workflow header says how to
 * take it deliberately; this file is what makes it deliberate rather than
 * incidental.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { DEDUPE_SENTINEL } from '../check-lockfile-dedupe.mjs';
import { NOT_A_GATE, OPTIONAL_CONTEXTS, REQUIRED_CONTEXTS } from '../dependabot-merge-gate.mjs';
import { pullRequestTrigger, readWorkflows, repoRoot, subscribesMergeGroup } from './workflow-checks.js';

const SCRIPT = 'scripts/check-lockfile-dedupe.mjs';
const WORKFLOW = 'lockfile-dedupe.yml';
const CONTEXT = 'Lockfile Dedupe Check';

/**
 * Real `pnpm@10.31.0` output, same capture objectui#8333 took and the checker's
 * `--self-test` carries: a tree where `better-auth` has forked `zod`.
 */
const PNPM_RED = [
  '@objectstack/spec@17.4.0(ai@7.0.65(zod@4.6.4))',
  '└── zod 4.4.3 → 4.6.4',
  '',
  '+ zod-validation-error@4.0.2(zod@4.6.4)',
  '- @ai-sdk/gateway@4.0.52(zod@4.4.3)',
  '- @objectstack/spec@17.4.0(ai@7.0.65(zod@4.4.3))',
  '- ai@7.0.65(zod@4.4.3)',
  '- zod@4.4.3',
  '',
  DEDUPE_SENTINEL,
  '',
].join('\n');

/** Real `pnpm@10.31.0` output on a deduped tree. */
const PNPM_GREEN = ' WARN  7 deprecated subdependencies found: glob@7.2.3\nProgress: resolved 1767, done\n';

/**
 * Real `pnpm@10.31.0` output captured on objectui#9562 by pointing the registry
 * at a closed port while the lockfile stayed byte-identical. ⭐ This is the
 * shape that used to red a REQUIRED context for a reason that was not about the
 * pull request — it exits non-zero and carries NO remedy sentinel.
 */
const PNPM_REGISTRY_DOWN = [
  ' WARN  GET http://127.0.0.1:9/@dnd-kit%2Fcore error (ECONNREFUSED). Will retry in 10 seconds. 2 retries left.',
  ' ERR_PNPM_META_FETCH_FAIL  GET http://127.0.0.1:9/@dnd-kit%2Fcore: request to',
  ' http://127.0.0.1:9/@dnd-kit%2Fcore failed, reason: connect ECONNREFUSED 127.0.0.1:9',
  '',
].join('\n');

interface CheckerRun {
  status: number | null;
  stdout: string;
  stderr: string;
  /** Written by the stub and by nothing else — absent means the real pnpm ran. */
  pnpmArgv: string | null;
}

/**
 * Run the checker AS SHIPPED with `pnpm` stubbed on `PATH`.
 *
 * ⛔ The only way this file may invoke the checker. The stub records its argv,
 * and every caller asserts that recording exists — that is the control which
 * makes "no live reading" a measurement rather than a promise in a comment.
 */
function runChecker(stub: { stdout?: string; stderr?: string; exit: number }): CheckerRun {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lockfile-dedupe-stub-'));
  try {
    const bin = path.join(dir, 'bin');
    fs.mkdirSync(bin);
    const argvFile = path.join(dir, 'pnpm-argv');
    const stdoutFile = path.join(dir, 'pnpm-stdout');
    const stderrFile = path.join(dir, 'pnpm-stderr');
    fs.writeFileSync(stdoutFile, stub.stdout ?? '');
    fs.writeFileSync(stderrFile, stub.stderr ?? '');
    const pnpm = path.join(bin, 'pnpm');
    fs.writeFileSync(
      pnpm,
      [
        '#!/usr/bin/env bash',
        `printf '%s' "$*" > ${JSON.stringify(argvFile)}`,
        `cat ${JSON.stringify(stdoutFile)}`,
        `cat ${JSON.stringify(stderrFile)} >&2`,
        `exit ${stub.exit}`,
        '',
      ].join('\n'),
    );
    fs.chmodSync(pnpm, 0o755);

    const proc = spawnSync('node', [SCRIPT], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}${path.delimiter}${process.env.PATH ?? ''}`,
      },
    });
    return {
      status: proc.status,
      stdout: proc.stdout,
      stderr: proc.stderr,
      pnpmArgv: fs.existsSync(argvFile) ? fs.readFileSync(argvFile, 'utf8') : null,
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('the lockfile-dedupe checker', () => {
  it('ships its own self-test, and it passes as shipped', () => {
    const run = spawnSync('node', [SCRIPT, '--self-test'], { cwd: repoRoot, encoding: 'utf8' });
    expect(run.status, `${SCRIPT} --self-test failed:\n${run.stdout}\n${run.stderr}`).toBe(0);
    expect(run.stdout).toContain('self-test:');
    // Anti-vacuity: a self-test that asserted nothing would also exit 0.
    expect(run.stdout).toMatch(/\d+ cases pass/);
  });

  it('asks pnpm for `dedupe --check`, which is WHY it cannot rewrite the lockfile', () => {
    // This replaces a live leg that re-resolved the whole workspace and then
    // compared the lockfile's bytes. That leg could only catch a dropped
    // `--check` if the run happened to rewrite something; this catches it
    // always, and in milliseconds. `--check` is pnpm's own contract for
    // "report without installing packages or editing the lockfile".
    const run = runChecker({ stdout: PNPM_GREEN, exit: 0 });
    expect(run.pnpmArgv, 'the stub did not serve this run — a live pnpm reached the registry').toBe('dedupe --check');
  });

  it('reports a deduped tree as clean, on stdout, exit 0', () => {
    const run = runChecker({ stdout: PNPM_GREEN, exit: 0 });
    expect(run.pnpmArgv).toBe('dedupe --check');
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('VERDICT deduped');
  });

  it('reports a collapsible tree as a finding, names the packages, exit 1', () => {
    const run = runChecker({ stdout: PNPM_RED, exit: 1 });
    expect(run.pnpmArgv).toBe('dedupe --check');
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('VERDICT not deduped');
    expect(run.stderr).toContain('zod');
    expect(run.stderr).toContain('@objectstack/spec');
    // The annotation is what a reviewer sees on the Files tab.
    expect(run.stderr).toContain('::error title=Lockfile dedupe::');
    // A finding is never written to stdout, where a `VERDICT deduped` grep would
    // be looking for it.
    expect(run.stdout).not.toContain('VERDICT');
  });

  it('⭐ a registry it cannot reach is NOT a finding and NOT a pass — exit 2', () => {
    // The leg objectui#9562 turns on. Before it, this same condition arrived in
    // a REQUIRED context as a bare `expect(status).toBe(0)` failure, telling the
    // reader to run `pnpm dedupe` and commit the lockfile — advice that is
    // wrong here and, because the lockfile is shared by every open pull
    // request, advice that spreads.
    const run = runChecker({ stderr: PNPM_REGISTRY_DOWN, exit: 1 });
    expect(run.pnpmArgv).toBe('dedupe --check');
    expect(run.status).not.toBe(0);
    expect(run.status, 'a crash must not be reported as a lockfile finding').not.toBe(1);
    expect(run.status).toBe(2);
    expect(run.stderr).toContain('VERDICT could not take a reading');
    expect(run.stderr).toContain('Nothing here was judged');
    // ⛔ It must not print the remedy: there is no finding to remedy.
    expect(run.stderr).not.toContain('VERDICT not deduped');
  });

  it('treats a signal-killed pnpm as could-not-run, never as clean', () => {
    // `status === null` is unreachable through a shell stub, so this pins the
    // next-worst shape the checker must not read as a pass: a non-zero exit
    // with no output at all.
    const run = runChecker({ exit: 137 });
    expect(run.pnpmArgv).toBe('dedupe --check');
    expect(run.status).toBe(2);
    expect(run.stderr).toContain('VERDICT could not take a reading');
  });

  it('returns the same verdict and the same bytes for the same input', () => {
    // The property objectui#9562 is about, asserted over the half of the input
    // this repository controls. ⚠️ It says nothing about the live reading in
    // `lockfile-dedupe.yml`, which is still registry-dependent by design.
    const first = runChecker({ stdout: PNPM_RED, exit: 1 });
    const second = runChecker({ stdout: PNPM_RED, exit: 1 });
    expect(first.pnpmArgv).toBe('dedupe --check');
    expect(second.pnpmArgv).toBe('dedupe --check');
    expect(second.status).toBe(first.status);
    expect(second.stdout).toBe(first.stdout);
    expect(second.stderr).toBe(first.stderr);
  });
});

describe('the lockfile-dedupe gate is wired the way its header claims', () => {
  const workflows = readWorkflows();
  const workflow = workflows.find((w) => w.file === WORKFLOW);
  /** The workflow with comment lines stripped — prose may not satisfy wiring. */
  const body = () => workflow!.lines.join('\n');

  it('has a workflow that runs the checker', () => {
    expect(workflow, `${WORKFLOW} not found — the gate would never run`).toBeDefined();
    // Comment-stripped throughout: a header comment mentioning the script must
    // not be able to satisfy a wiring assertion about what the job RUNS.
    expect(body()).toContain(`node ${SCRIPT}`);
    expect(body()).toContain(`name: ${CONTEXT}`);
  });

  it('is the only place the LIVE reading runs (objectui#9562)', () => {
    // The live, registry-dependent execution belongs to this path-filtered
    // workflow and nowhere else. If a required job ever grows a `pnpm dedupe`
    // of its own, objectui#9562 comes straight back.
    const live = workflows.filter((w) => w.lines.join('\n').includes(`node ${SCRIPT}`)).map((w) => w.file);
    expect(live).toEqual([WORKFLOW]);
  });

  it('is path-filtered, and the filter lists the gate’s own runtime closure', () => {
    const trigger = pullRequestTrigger(workflow!);
    expect(trigger.subscribes, 'the gate must run on pull requests').toBe(true);
    expect(trigger.filtered, 'a path filter is what keeps it out of the REQUIRED set').toBe(true);
    // Without these the checker can ship having never run once, and the wiring
    // bug then surfaces on somebody else's next lockfile pull request.
    for (const file of ['pnpm-lock.yaml', `.github/workflows/${WORKFLOW}`, SCRIPT, 'scripts/invoked-as.mjs']) {
      expect(body(), `${file} missing from the path filter`).toContain(file);
    }
  });

  it('declares no merge_group trigger, per objectui#3523', () => {
    // A path-filtered, non-required gate that subscribes the queue stalls it
    // until the ruleset timeout.
    expect(subscribesMergeGroup(workflow!)).toBe(false);
  });

  it('uses the shared pnpm setup rather than a bare corepack call', () => {
    expect(body()).toContain('bash scripts/ci-setup-pnpm.sh');
    expect(body()).not.toMatch(/^\s*run:.*corepack/m);
  });

  it('is classified as a BLOCKING (optional) context, not an alarm', () => {
    // ⚠️ The load-bearing assertion. Moving this name to NOT_A_GATE is a real
    // option — the workflow header documents it as a one-line flip — but it is
    // a decision about what may auto-merge, so it fails here first.
    expect(Object.keys(OPTIONAL_CONTEXTS)).toContain(CONTEXT);
    expect(Object.keys(NOT_A_GATE)).not.toContain(CONTEXT);
    // And it may not be REQUIRED while the path filter stands (objectui#3523).
    expect(REQUIRED_CONTEXTS as readonly string[]).not.toContain(CONTEXT);
  });

  it('the classification says why it blocks where its neighbour does not', () => {
    const reason = OPTIONAL_CONTEXTS[CONTEXT as keyof typeof OPTIONAL_CONTEXTS];
    expect(reason).toBeTruthy();
    expect(reason).toContain('pnpm dedupe');
    // The neighbour's reservation must stay visible and untouched.
    expect(Object.keys(NOT_A_GATE)).toContain('Lockfile Integrity Check');
  });
});
