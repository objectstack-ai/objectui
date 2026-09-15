#!/usr/bin/env node
/**
 * Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.
 *
 * The committed `pnpm-lock.yaml` must already be DEDUPED: running
 * `pnpm dedupe` on it may not collapse anything (objectui#8333).
 *
 *   Run:  node scripts/check-lockfile-dedupe.mjs             (`pnpm check:lockfile-dedupe`)
 *         node scripts/check-lockfile-dedupe.mjs --self-test
 *
 * ## What this is for, and why it is not objectui#8326's gate
 *
 * objectui#8326's `check-lockfile-integrity.mjs` reports a DELTA: it compares a
 * pull request's lockfile with its merge base and names anything that gained a
 * physical copy. It answers "did THIS change duplicate something?".
 *
 * This gate answers a different question, about one tree and no base: "is the
 * lockfile in a state where `pnpm dedupe` would still have work to do?" The two
 * are independent — a tree can be delta-clean and still carry years of
 * accumulated duplication, which is exactly the state `main` was in until
 * objectui#9215 collapsed 47 identities out of it.
 *
 * ## The defect this closes, in the order it happens
 *
 * 1. A dependency bump re-resolves part of the peer graph and forks a package
 *    that was single-copy. Measured on objectui#8333: bumping `better-auth`
 *    alone splits `zod` into a third physical copy and pulls `@objectstack/spec`
 *    and `ai` into a second peer context each. No declaration, range or override
 *    anywhere in the workspace changed — it is partial-re-resolution debt.
 * 2. `Bundle Analysis` then reads a bundle that grew, and the growth is
 *    attributed to the bump. It is not the bump: it is the fork.
 * 3. The remedy is `pnpm dedupe`. But `pnpm dedupe` is NOT SURGICAL — it
 *    collapses every collapsible duplicate in the tree, not just the one the
 *    bump created. Run inside a bump PR on a tree carrying old duplication, it
 *    drags all of that along, and the reviewer reads the combined delta as the
 *    bump's. That is the SAME misattribution, aimed at a different PR.
 *
 * ⇒ requiring the remedy is only honest once the tree is already deduped. That
 * is why objectui#8333's ruling was "B then A": pay the accumulated debt down in
 * its own dedicated pull request FIRST (objectui#9215, landed), and only then
 * require the remedy in bump PRs. This gate is the second half, and its whole
 * value depends on the first half staying true — which is precisely what it
 * enforces. Without it `main` drifts back to a duplicated tree and the next bump
 * PR's dedupe is expensive and unreadable again.
 *
 * ## Why the verdict is pnpm's exit code and not a parse of its output
 *
 * `pnpm dedupe --check` is pnpm's own contract: exit 0 when nothing would
 * change, non-zero when something would. This gate does not re-derive that. It
 * reads the exit code, and parses the output ONLY to NAME the packages in the
 * annotation. A parse that finds nothing still reds on a non-zero exit — the
 * names are a convenience and can never change the verdict, so a future change
 * to pnpm's report format degrades the message and not the judgement.
 *
 * The one thing the output IS load-bearing for is telling a FINDING apart from a
 * CRASH. Both exit non-zero, and "the registry was unreachable" is not a finding
 * about the diff. So a non-zero exit counts as a finding only when the output
 * carries pnpm's own remedy sentinel; otherwise this exits 2, "could not take a
 * reading", which is never a pass.
 *
 * ## ⚠️ This gate reads the REGISTRY, unlike its neighbour
 *
 * `check-lockfile-integrity.mjs` is one `node` call over two text files.
 * This one shells out to pnpm, which resolves against `registry.npmjs.org`, so
 * it costs a network round trip and can fail for reasons that are about the
 * world rather than the diff. That failure lands on exit 2 (see above) with a
 * message saying so, rather than being reported as a lockfile finding.
 *
 * ⚠️ Stated because it bounds what the green means: `pnpm dedupe` does NOT chase
 * the newest version admitted by a range — it only collapses copies that are
 * already in the tree. Measured on objectui#8333: `better-auth` is declared
 * `^1.7.2` and locked at `1.7.2` while the registry already serves `1.7.4`,
 * which that range admits, and this gate is green on that tree. So a publish to
 * the registry does not by itself turn this gate red, and it is not the
 * spontaneously-drifting check that a "resolve against the live registry" gate
 * sounds like. That is an argument from one measured instance plus pnpm's
 * documented behaviour, ⛔ not a proof over all future pnpm versions; the
 * instrument that re-derives it is this gate's own run history.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isEntrypoint } from './invoked-as.mjs';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/**
 * pnpm's own remedy line, printed only when `--check` found something to
 * collapse. It is what separates a FINDING from a CRASH, both of which exit
 * non-zero. Captured verbatim from `pnpm@10.31.0`.
 */
export const DEDUPE_SENTINEL = 'Run pnpm dedupe to apply the changes above.';

export const EXIT_CLEAN = 0;
export const EXIT_FINDINGS = 1;
/** A reading that could not be taken is NOT a deduped lockfile. */
export const EXIT_CANNOT_RUN = 2;

/**
 * The verdict, from pnpm's exit status plus the sentinel.
 *
 * `status === 0` with the sentinel present is contradictory — pnpm would be
 * saying both "nothing to do" and "run dedupe" — so it is reported as
 * `cannot-run` rather than being resolved in either direction.
 *
 * @param {{ status: number|null, output: string }} run
 * @returns {'clean'|'findings'|'cannot-run'}
 */
export function classify({ status, output = '' }) {
  const sentinel = output.includes(DEDUPE_SENTINEL);
  if (status === 0) return sentinel ? 'cannot-run' : 'clean';
  return sentinel ? 'findings' : 'cannot-run';
}

/**
 * Best-effort: the package NAMES whose copies `pnpm dedupe` would collapse.
 *
 * `--check` lists the snapshot keys it would remove as `- <identity>` lines,
 * where an identity is `name@version` optionally followed by a `(peer)` suffix.
 * Scoped names carry a leading `@`, so the version separator is the LAST `@`
 * before any peer suffix.
 *
 * ⛔ Never load-bearing: an empty result does not make a non-zero exit clean.
 *
 * @param {string} output
 * @returns {string[]} sorted, unique
 */
export function namesFromOutput(output = '') {
  const names = new Set();
  for (const line of output.split('\n')) {
    const match = /^-\s+(\S.*?)\s*$/.exec(line);
    if (!match) continue;
    const base = match[1].split('(')[0];
    const at = base.lastIndexOf('@');
    if (at <= 0) continue;
    names.add(base.slice(0, at));
  }
  return [...names].sort();
}

/**
 * @param {{ outcome: 'clean'|'findings'|'cannot-run', names?: string[], output?: string }} reading
 * @returns {string[]} lines to print
 */
export function renderVerdict({ outcome, names = [], output = '' }) {
  if (outcome === 'clean') {
    return ['VERDICT deduped — `pnpm dedupe` would collapse nothing in this lockfile.'];
  }
  if (outcome === 'cannot-run') {
    return [
      'VERDICT could not take a reading — `pnpm dedupe --check` did not report a result.',
      'This is a fact about the run (registry, toolchain, or a changed pnpm report format),',
      'NOT a verdict on this change. Nothing here was judged.',
      ...(output ? ['', '--- pnpm output ---', output.trimEnd()] : []),
    ];
  }
  const named = names.length ? names.join(', ') : '(pnpm named no removable identity — see its output above)';
  return [
    output.trimEnd(),
    '',
    `VERDICT not deduped — \`pnpm dedupe\` would still collapse duplicate copies: ${named}.`,
    'Two physical copies of one package are two real paths in the bundle. Fix it HERE, in this',
    'pull request, by running `pnpm dedupe` and committing the lockfile — so that a downstream',
    '`Bundle Analysis` reading measures this change and not resolution collateral left behind by',
    'an earlier one (objectui#8333).',
    '⛔ Do NOT satisfy this by pinning a version, adding a `pnpm.overrides` entry or widening a',
    'range: those spend a declaration to fix a resolution artefact, and objectui#8333 rejected',
    'both. `pnpm dedupe` changes no declaration at all.',
  ];
}

/**
 * @param {string[]} argv
 * @returns {number} process exit code
 */
export function main(argv = process.argv.slice(2)) {
  const run = spawnSync('pnpm', ['dedupe', '--check'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  if (run.error) {
    console.error(
      `::error title=Lockfile dedupe::could not run \`pnpm dedupe --check\`: ${run.error.message}`,
    );
    for (const line of renderVerdict({ outcome: 'cannot-run' })) console.error(line);
    return EXIT_CANNOT_RUN;
  }

  // pnpm writes its report across both streams; the verdict reads them together.
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  const outcome = classify({ status: run.status, output });
  const names = outcome === 'findings' ? namesFromOutput(output) : [];

  const lines = renderVerdict({ outcome, names, output });
  const write = outcome === 'clean' ? console.log : console.error;
  for (const line of lines) write(line);

  if (outcome === 'clean') return EXIT_CLEAN;
  if (outcome === 'cannot-run') return EXIT_CANNOT_RUN;

  console.error(
    `::error title=Lockfile dedupe::${names.join(', ') || 'duplicate copies'} — run \`pnpm dedupe\` and commit the lockfile. ` +
      'This is resolution collateral, not a bundle regression (objectui#8333).',
  );
  return EXIT_FINDINGS;
}

/**
 * Cases built from REAL `pnpm@10.31.0` output captured on objectui#8333: the
 * green leg is today's `main`, the red leg is the same tree with `better-auth`
 * bumped, which forks `zod`.
 *
 * @returns {number}
 */
export function selfTest() {
  /** @type {{ name: string, ok: boolean }[]} */
  const cases = [];
  const t = (name, ok) => cases.push({ name, ok: Boolean(ok) });

  const RED = [
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
  const GREEN = ' WARN  7 deprecated subdependencies found: glob@7.2.3\nProgress: resolved 1767, done\n';

  // ── the verdict comes from the exit code, disambiguated by the sentinel ────
  t('a zero exit with no sentinel is clean', classify({ status: 0, output: GREEN }) === 'clean');
  t('a non-zero exit carrying the sentinel is a finding', classify({ status: 1, output: RED }) === 'findings');
  t(
    'a non-zero exit WITHOUT the sentinel is could-not-run, not a finding',
    classify({ status: 1, output: 'ERR_PNPM_FETCH_404  GET https://registry.npmjs.org/x' }) === 'cannot-run',
  );
  t(
    'a crash with no output at all is could-not-run, never clean',
    classify({ status: 137, output: '' }) === 'cannot-run',
  );
  t(
    'a contradictory zero-exit-with-sentinel is could-not-run, not silently clean',
    classify({ status: 0, output: RED }) === 'cannot-run',
  );
  t('a null status (killed by signal) is could-not-run', classify({ status: null, output: '' }) === 'cannot-run');

  // ── the names are a convenience; they never decide anything ───────────────
  const names = namesFromOutput(RED);
  t('names the unscoped package whose copy is removed', names.includes('zod'));
  t('names a SCOPED package without eating its leading @', names.includes('@objectstack/spec'));
  t('strips the peer suffix rather than reporting it as part of the name', names.includes('ai'));
  t('does not report the ADDED identity as removed', !names.includes('zod-validation-error'));
  t('reports each name once, sorted', JSON.stringify(names) === JSON.stringify([...new Set(names)].sort()));
  t('finds nothing in clean output', namesFromOutput(GREEN).length === 0);
  t(
    'CONTROL — a red verdict still reds when the parse names nothing',
    renderVerdict({ outcome: 'findings', names: [], output: RED }).some((l) => l.startsWith('VERDICT not deduped')),
  );

  // ── the rendered verdicts say which of the three answers this was ─────────
  t('clean renders VERDICT deduped', renderVerdict({ outcome: 'clean' })[0].startsWith('VERDICT deduped'));
  t(
    'a finding names the packages and points at `pnpm dedupe`',
    renderVerdict({ outcome: 'findings', names, output: RED }).join('\n').includes('`pnpm dedupe`'),
  );
  t(
    'a finding forbids the rejected remedies by name',
    renderVerdict({ outcome: 'findings', names, output: RED }).join('\n').includes('pnpm.overrides'),
  );
  t(
    'could-not-run says it judged nothing',
    renderVerdict({ outcome: 'cannot-run' }).join('\n').includes('Nothing here was judged'),
  );

  const failed = cases.filter((c) => !c.ok);
  for (const c of failed) console.error(`  ✗ ${c.name}`);
  if (failed.length) {
    console.error(`✗ check-lockfile-dedupe self-test: ${failed.length} of ${cases.length} case(s) failed.`);
    return 1;
  }
  console.log(
    `✓ check-lockfile-dedupe self-test: ${cases.length} cases pass ` +
      '(the three verdicts, the crash-vs-finding split, and the controls a name-parser-driven gate would fail).',
  );
  return 0;
}

if (isEntrypoint(import.meta.url)) {
  if (process.argv.includes('--self-test')) {
    process.exitCode = selfTest();
  } else {
    try {
      process.exitCode = main();
    } catch (error) {
      console.error(
        `::error::check-lockfile-dedupe could not take a reading: ${error instanceof Error ? error.message : String(error)}`,
      );
      console.error('A reading that could not be taken is NOT a deduped lockfile.');
      process.exitCode = EXIT_CANNOT_RUN;
    }
  }
}
