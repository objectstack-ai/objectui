/**
 * objectui#8333 — the lockfile-dedupe gate, pinned against the thing it exists
 * to prevent and against the ways it could be worthless.
 *
 * The checker's own verdict logic is exercised by `--self-test` inside the
 * script (no pnpm, no network). This file adds the three things that cannot
 * say:
 *
 *   1. the self-test really passes, run as shipped rather than re-implemented;
 *   2. it is GREEN on this repository's real committed `pnpm-lock.yaml` — the
 *      property objectui#9215 established and this gate defends;
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
 *
 * ⚠️ (2) is deliberately NOT paired with a red over the same corpus here. The
 * red direction costs a full re-resolve of a mutated manifest plus a registry
 * round trip, which is not a unit test's to spend; it is measured on
 * objectui#8333's pull request instead, and the checker's `--self-test` holds
 * the red/green discrimination over captured pnpm output. What this file must
 * not become is a green-only assertion whose checker could never fail — which
 * is why case (1) runs the self-test, whose controls include exactly that.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { NOT_A_GATE, OPTIONAL_CONTEXTS, REQUIRED_CONTEXTS } from '../dependabot-merge-gate.mjs';
import { pullRequestTrigger, readWorkflows, repoRoot, subscribesMergeGroup } from './workflow-checks.js';

const SCRIPT = 'scripts/check-lockfile-dedupe.mjs';
const WORKFLOW = 'lockfile-dedupe.yml';
const CONTEXT = 'Lockfile Dedupe Check';

describe('the lockfile-dedupe checker', () => {
  it('ships its own self-test, and it passes as shipped', () => {
    const run = spawnSync('node', [SCRIPT, '--self-test'], { cwd: repoRoot, encoding: 'utf8' });
    expect(run.status, `${SCRIPT} --self-test failed:\n${run.stdout}\n${run.stderr}`).toBe(0);
    expect(run.stdout).toContain('self-test:');
    // Anti-vacuity: a self-test that asserted nothing would also exit 0.
    expect(run.stdout).toMatch(/\d+ cases pass/);
  });

  it('is GREEN on this repository’s real committed lockfile', () => {
    // The property objectui#9215 paid for and this gate defends. If this ever
    // reds, `main` has re-accrued collapsible duplication and the remedy is
    // `pnpm dedupe`, not an edit to this test.
    const run = spawnSync('node', [SCRIPT], { cwd: repoRoot, encoding: 'utf8' });
    expect(
      run.status,
      `${SCRIPT} is not green on the committed lockfile:\n${run.stdout}\n${run.stderr}`,
    ).toBe(0);
    expect(run.stdout).toContain('VERDICT deduped');
  }, 300_000);

  it('does not rewrite the lockfile it judges', () => {
    const lockfile = path.join(repoRoot, 'pnpm-lock.yaml');
    const before = fs.readFileSync(lockfile);
    expect(before.length, 'the lockfile read back empty — this assertion would be vacuous').toBeGreaterThan(0);
    execFileSync('node', [SCRIPT], { cwd: repoRoot, encoding: 'utf8' });
    expect(fs.readFileSync(lockfile).equals(before)).toBe(true);
  }, 300_000);
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
