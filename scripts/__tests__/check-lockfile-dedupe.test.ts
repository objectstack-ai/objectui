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
 * ## ⛔ And neither may anything ELSE that a required job runs (objectui#9693)
 *
 * The assertion below that pins the live reading to ONE place used to be
 * measured over the workflow files and nothing else. Its own comment stated the
 * intent as "if a required job ever grows a `pnpm dedupe` of its own" — but the
 * way a required job actually grew one, the time it happened, was through THIS
 * FILE, and a test file is not a workflow. ⇒ the lock named after objectui#9562
 * could not have seen objectui#9562 arrive: another test file spawning the
 * checker, or running `pnpm dedupe` itself, was green.
 *
 * So the population is now every place in what CI runs that this repository can
 * enumerate, in ONE assertion — ⛔ never a second lock per class of file, which
 * would only move the blind spot to the next class:
 *
 *   - every workflow, comment LINES stripped (prose may not satisfy wiring);
 *   - every tracked test file, plus the `vitest.config` / `vitest.setup`
 *     modules loaded around them, with COMMENTS BLANKED through
 *     `scripts/js-comment-mask.mjs` — the tree's one answer to "comment, or
 *     code?". The paragraph you are reading names both hazardous spellings, so
 *     without the mask this assertion could never be green.
 *
 * The exemption list is two entries and each is checkable: the path-filtered
 * workflow, and this file, whose every run asserts the stub served it.
 *
 * ⚠️ What the scan still does NOT see — said here because nothing re-derives it:
 *
 *   - a non-test SCRIPT that a required job runs, which shells out to `pnpm
 *     dedupe` itself. Its callers carry no marker, and the tree's own
 *     classification strings quote the command in prose that no mask blanks, so
 *     that population needs a way to tell a command from a citation before it
 *     can be added;
 *   - an invocation assembled at runtime (`path.join(root, 'scripts', …)`)
 *     rather than written as the path;
 *   - a file that is not tracked, since the walk is `git ls-files`. CI only
 *     ever runs tracked bytes, so this bites locally — before `git add` — and
 *     not in the context the lock protects.
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
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { DEDUPE_SENTINEL } from '../check-lockfile-dedupe.mjs';
import { FLOORS, TEST_FILE } from '../check-test-path-roots.mjs';
import { NOT_A_GATE, OPTIONAL_CONTEXTS, REQUIRED_CONTEXTS } from '../dependabot-merge-gate.mjs';
import { maskComments } from '../js-comment-mask.mjs';
import { pullRequestTrigger, readWorkflows, repoRoot, subscribesMergeGroup } from './workflow-checks.js';

const SCRIPT = 'scripts/check-lockfile-dedupe.mjs';
const WORKFLOW = 'lockfile-dedupe.yml';
const CONTEXT = 'Lockfile Dedupe Check';

/** This file, by its own path — a rename may not silently drop what it pins. */
const THIS_FILE = path.relative(repoRoot, fileURLToPath(import.meta.url));

/**
 * The spellings that TAKE the live reading, as opposed to naming it.
 *
 * ⛔ Not the word `dedupe` on its own: this repository spends that word on UI
 * dedupe keys in hundreds of files, and a marker that fires on those is one
 * nobody can keep green.
 */
const LIVE_READING = [
  /** The shipped checker, run by any means: a `run:` step, a spawn argument, a package script body. */
  new RegExp(SCRIPT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  /** pnpm's own dedupe — shell form (`pnpm dedupe --check`) and argv form (`'pnpm', ['dedupe'`) together. */
  /\bpnpm\b[\s'",[\]()]{1,12}\bdedupe\b/,
  /** The package script that is a second name for the first marker. */
  /\bcheck:lockfile-dedupe\b/,
];

/** Does this CODE take the live reading? Blanking the comments is the caller's job. */
function takesLiveReading(code: string): boolean {
  return LIVE_READING.some((marker) => marker.test(code));
}

/**
 * The modules vitest loads AROUND every test file. A live reading here would
 * run in every file of the project rather than in one, so they are scanned on
 * the same terms as the tests themselves.
 */
const VITEST_RUNTIME = /^vitest\.(config|setup)[.\w-]*\.(ts|tsx|mts|js|mjs)$/;

/** The same `git ls-files -z` walk `check-test-path-roots.mjs` takes over this same population. */
function trackedFiles(): string[] {
  return execFileSync('git', ['ls-files', '-z'], { cwd: repoRoot, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
}

interface LiveScan {
  /** Repo-relative paths that take the live reading, sorted. */
  sites: string[];
  /** How many workflows were read — a floor under the equality, so a collapsed read cannot pass. */
  workflows: number;
  /** The source files that were read, so the same floor covers the other half. */
  population: string[];
}

/**
 * Every place in what CI RUNS that takes the live reading.
 *
 * Two carriers, one population (objectui#9693): the workflows, which say what a
 * job runs, and the files those jobs execute — every tracked test file plus the
 * vitest runtime modules. Workflow comment LINES are stripped by `readWorkflows`;
 * source comments are blanked by `scripts/js-comment-mask.mjs`, the tree's one
 * answer to "comment, or code?", so the paragraphs in this very file explaining
 * the hazard cannot count as the hazard.
 */
function scanForLiveReading(): LiveScan {
  const workflows = readWorkflows();
  const sites = workflows
    .filter((workflow) => takesLiveReading(workflow.lines.join('\n')))
    .map((workflow) => `.github/workflows/${workflow.file}`);

  const population = trackedFiles().filter((file) => TEST_FILE.test(file) || VITEST_RUNTIME.test(file));
  for (const file of population) {
    let text: string;
    try {
      text = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    } catch {
      continue; // a tracked-but-absent path (a stale index) is not this assertion's business
    }
    // A pre-filter and ONLY a pre-filter: masking blanks spans, so it can remove
    // a hit and never add one — a file with no raw hit cannot have a masked one.
    if (!takesLiveReading(text)) continue;
    if (takesLiveReading(maskComments(text))) sites.push(file);
  }

  return { sites: sites.sort(), workflows: workflows.length, population };
}

/**
 * The only places a live reading may be taken, and why each may:
 *
 *   - the path-filtered, non-required workflow this gate was built around;
 *   - this file, which drives the checker ONLY through the `PATH` stub above —
 *     every run asserts `pnpmArgv`, so a leg that reached the real pnpm reds
 *     rather than going quiet, which is what makes this exemption checkable
 *     instead of trusted.
 *
 * ⛔ Nothing else belongs here. An addition is a live, registry-dependent
 * reading inside a REQUIRED context — objectui#9562, again.
 */
const LIVE_READING_SITES = [`.github/workflows/${WORKFLOW}`, THIS_FILE].sort();

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

  it('is the only place the LIVE reading runs, in workflows AND in what they run (objectui#9562, objectui#9693)', () => {
    // The live, registry-dependent execution belongs to one path-filtered
    // workflow and nowhere else. ⭐ "Nowhere else" is the whole assertion, and
    // it used to be measured over the workflows alone — while the way a
    // required job actually grew a `pnpm dedupe`, the time it happened, was
    // through a TEST FILE, which is not a workflow. So the population is both
    // carriers at once: one assertion over every place a live reading could
    // run, ⛔ never a second lock per class of file.
    const scan = scanForLiveReading();

    // Floors first. An equality over a population that collapsed to nothing
    // passes for the wrong reason, and this one spans two independent reads —
    // so each read carries its own floor. `check-test-path-roots.mjs` already
    // publishes the floor for the test-file half; this reuses it rather than
    // writing a second number that would drift from it.
    expect(scan.workflows, 'the workflow read collapsed').toBeGreaterThan(20);
    expect(scan.population.length, 'the source read collapsed').toBeGreaterThan(FLOORS.testFiles);
    // …and it reached this file's PEERS and the runtime modules, not just the
    // two files the expectation names — a scan that only ever looked at itself
    // would satisfy the equality below exactly as well.
    expect(scan.population.filter((f) => f.startsWith('scripts/__tests__/') && f !== THIS_FILE).length).toBeGreaterThan(50);
    expect(scan.population).toContain('vitest.setup.base.ts');

    // The equality is also the positive control for both halves: one member is
    // a workflow and the other a test file, so a carrier that stopped being
    // read goes red here rather than going quiet.
    expect(scan.sites, 'a live, registry-dependent reading inside a REQUIRED context — objectui#9562, again').toEqual(
      LIVE_READING_SITES,
    );
  });

  it('the population test fires on every route objectui#9693 enumerates, and not on prose', () => {
    // The control for the detector the assertion above is built on. Each case
    // is the spelling ITSELF rather than a description of one, so a marker that
    // stopped matching fails here instead of reporting an empty tree as clean.

    // Row 3 of objectui#9693: another test file spawns the shipped checker.
    expect(takesLiveReading(maskComments(`spawnSync('node', ['${SCRIPT}'], { cwd: repoRoot });`))).toBe(true);
    // Row 4: another file runs pnpm's dedupe itself, in either spelling.
    expect(takesLiveReading(maskComments(`spawnSync('pnpm', ['dedupe', '--check'], { cwd: repoRoot });`))).toBe(true);
    // Row 1, and the indirection through this repository's own script name —
    // a `run:` step reaches the same live reading by either spelling.
    expect(takesLiveReading(`      run: node ${SCRIPT}`)).toBe(true);
    expect(takesLiveReading('      run: pnpm dedupe --check')).toBe(true);
    expect(takesLiveReading('      run: pnpm check:lockfile-dedupe')).toBe(true);

    // ⛔ And prose about the hazard is not the hazard: this file's own header
    // discusses both spellings at length, so without the mask the assertion
    // above could never be green and the next author would loosen it.
    expect(takesLiveReading(maskComments(`// never spawn ${SCRIPT} from here; run \`pnpm dedupe\` by hand`))).toBe(false);
    expect(takesLiveReading(maskComments(`/* ${SCRIPT} is the checker */`))).toBe(false);
    // Nor is the word this repository spends on UI dedupe keys everywhere.
    expect(takesLiveReading(maskComments('const dedupe = new Set<string>();'))).toBe(false);
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
