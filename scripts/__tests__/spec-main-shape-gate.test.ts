import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { parseDiagnostics, renderSummary, declaredTypesTargets } from '../spec-main-shape-gate.mjs';
import { pullRequestTrigger, readWorkflows, repoRoot, subscribesMergeGroup } from './workflow-checks.js';

/**
 * objectui#9860 — the maintainer's option C: the ONLY shape gate for
 * `@objectstack/spec`'s public surface is a real consumer compiling against
 * objectstack's `main`, and objectui is that consumer.
 *
 * ⭐ The card's acceptance criterion is not "there is a job". It is that a RED
 * names **which objectui file fails against which objectstack commit**, so the
 * objectstack pull request that moved the shape is the one that answers. A gate
 * that only goes red is not this card, so that property is asserted here on a
 * fixture that carries a real diagnostic shape, in both directions.
 *
 * ## Why the workflow assertions read COMMENT-STRIPPED lines
 *
 * This workflow DOCUMENTS its own subject: its header discusses the turbo cache,
 * `TURBO_FORCE`, the pipeline trap and the pin, in prose. A source-text
 * assertion over the raw file would therefore be satisfied by the comment that
 * explains the mechanism even if the mechanism itself were deleted — the pin
 * would survive the very edit it exists to catch. `readWorkflows()` strips
 * comment lines, and the control below proves the stripping is live rather than
 * assumed.
 */
const WORKFLOW = 'spec-main-shape-gate.yml';
const SCRIPT = 'scripts/spec-main-shape-gate.mjs';

const workflow = readWorkflows().find((candidate) => candidate.file === WORKFLOW);

/** The workflow with every comment line removed — what the assertions judge. */
function body(): string {
  return (workflow as NonNullable<typeof workflow>).lines.join('\n');
}

describe('the gate exists and is wired the way a requirable check has to be', () => {
  it('is a workflow in this repository', () => {
    expect(workflow, `${WORKFLOW} is missing from .github/workflows/`).toBeTruthy();
    expect(fs.existsSync(path.join(repoRoot, SCRIPT))).toBe(true);
  });

  it('the comment stripper is live — the control every assertion below rests on', () => {
    // A phrase that exists ONLY in the header prose. If it survives stripping,
    // every "the workflow contains X" assertion below could be satisfied by
    // documentation rather than by the workflow, which is this file's whole
    // reason for reading `lines` instead of `text`.
    expect(
      (workflow as NonNullable<typeof workflow>).text,
      'the header no longer carries the phrase this control keys on; pick another comment-only phrase',
    ).toContain('FALSE GREEN');
    expect(body()).not.toContain('FALSE GREEN');
  });

  it('subscribes pull_request with NO path filter, so it reports on every pull request', () => {
    const trigger = pullRequestTrigger(workflow as NonNullable<typeof workflow>);
    expect(trigger.subscribes).toBe(true);
    // objectui#3523: a check that does not report on every pull request cannot be
    // required — it leaves the PR pending rather than failing it. The gate's
    // subject is cross-repository drift, which moves without any file here
    // changing, so there is nothing a path filter could honestly select on.
    expect(trigger.filtered, 'a path filter would make this context unrequirable').toBe(false);
  });

  it('subscribes merge_group, so a maintainer can enrol it without stalling the queue', () => {
    // The #3523 ordering: subscribe first (a pure addition), enrol second. The
    // reverse order is the state in which every queued pull request burns the
    // ruleset's 60-minute timeout with nothing red to point at.
    expect(subscribesMergeGroup(workflow as NonNullable<typeof workflow>)).toBe(true);
  });

  it('runs both halves of the gate script', () => {
    expect(body()).toContain(`node ${SCRIPT} inject`);
    expect(body()).toContain(`node ${SCRIPT} report`);
  });
});

describe('the two ways this gate could report a verdict it never took', () => {
  it('bypasses the turbo cache when it compiles', () => {
    // turbo's hash covers sources, the lockfile and a declared env list — never
    // the CONTENT of `node_modules`, which is the only thing this job changes.
    // Cached, `type-check` replays a verdict taken against a different spec.
    // Keyed on the CALL, not on the identifier: the header discusses
    // `TURBO_FORCE` at length, and the stripped body is what runs.
    expect(body()).toMatch(/TURBO_FORCE=true pnpm type-check/);
    expect(
      body(),
      'a turbo cache action here would restore the verdict this gate exists to re-take',
    ).not.toMatch(/uses:\s*actions\/cache/);
  });

  it('captures the compiler exit code with no pipe in between', () => {
    // `pnpm type-check | tail` reports the PIPE's status, and `tail` essentially
    // never fails, so red and green would read identically.
    expect(body()).toMatch(/pnpm type-check > "\$RUNNER_TEMP\/typecheck\.log" 2>&1\n\s*code=\$\?/);
  });

  it('never moves the pin: no install flag or manifest edit that could', () => {
    // The card fences the pin-bump question off as still open with the
    // maintainer. The injection is post-install runner state; these are the
    // spellings that would make it something else.
    expect(body()).not.toContain('--no-frozen-lockfile');
    expect(body()).not.toMatch(/pnpm (add|link|update|dedupe)\b/);
    expect(body()).not.toContain('pnpm-workspace.yaml');
    expect(body()).toContain('pnpm install --frozen-lockfile');
  });
});

describe('the acceptance criterion: a red names the objectui FILE and the objectstack COMMIT', () => {
  const sha = '96cf32b07579c0cafb6d9e58bb51930cef48e48d';
  // The shape a real break takes, captured from a real run of this gate against
  // objectstack `main` — turbo prefix, package-relative path, TS code, message.
  const redLog =
    "@object-ui/core:build: src/utils/normalize-list-view.ts(205,3): error TS2353: Object literal " +
    "may only specify known properties, and 'page' does not exist in type 'Record<\"list\" | " +
    "\"detail\", string | null>'.";

  it('resolves the package-relative path a compiler prints into a path a reader can open', () => {
    const { rows } = parseDiagnostics(redLog);
    expect(rows).toHaveLength(1);
    expect(rows[0].file).toBe('packages/core/src/utils/normalize-list-view.ts');
    expect(rows[0].line).toBe(205);
    expect(rows[0].code).toBe('TS2353');
  });

  it('puts the file and the commit in the same report', () => {
    const { rows, unmappedPackages } = parseDiagnostics(redLog);
    const summary = renderSummary({ sha, rows, unmappedPackages, status: 1 });
    expect(summary).toContain('packages/core/src/utils/normalize-list-view.ts');
    expect(summary).toContain(sha);
  });

  it('refuses to report an unattributable failure as a shape break', () => {
    // The ablation of the assertion above. A compile that failed somewhere the
    // parser cannot see must NOT read as "objectstack moved the shape" — that
    // sends the wrong repository a bill. It also must not read as a pass.
    const summary = renderSummary({ sha, rows: [], unmappedPackages: [], status: 1 });
    expect(summary).toContain('no diagnostic could be attributed to a file');
    // Keyed on the CLAIM, not on a phrase: the refusal prose says the words
    // "not a shape break", so a `not.toContain('shape break')` would be asserting
    // that the explanation is absent rather than that the accusation is.
    expect(summary).not.toMatch(/\d+ diagnostic\(s\) in \d+ objectui file\(s\)/);
    expect(summary).not.toContain('| objectui file |');
  });

  it('says so plainly when the consumer still compiles', () => {
    const summary = renderSummary({ sha, rows: [], unmappedPackages: [], status: 0 });
    expect(summary).toContain('type-checks against');
    expect(summary).toContain(sha);
  });
});

describe('the injection refuses the inputs that would make a green meaningless', () => {
  it('knows which files `tsc` will actually read out of an exports map', () => {
    // A spec built with its declaration pass skipped packs, installs and
    // resolves — and fails every consumer with TS2307, which reads like a
    // hundred broken imports instead of one missing build step.
    expect(
      declaredTypesTargets({
        '.': { import: { types: './dist/index.d.mts', default: './dist/index.mjs' } },
        './ui': { browser: { require: { types: './dist/ui/index.d.ts', default: './x.js' } } },
      }),
    ).toEqual(['./dist/index.d.mts', './dist/ui/index.d.ts']);
    expect(declaredTypesTargets({ '.': './dist/index.js' })).toEqual([]);
  });
});

describe('the script re-derives its own behaviour', () => {
  it('passes its offline self-test', () => {
    // The CLI, not the imports: a self-test that only ran through this file's
    // imports would not prove the entry point works.
    const output = execFileSync('node', [path.join(repoRoot, SCRIPT), '--self-test'], {
      encoding: 'utf8',
    });
    expect(output).not.toContain('FAIL');
    expect(output).toMatch(/--self-test: \d+\/\d+ passed/);
  });
});
