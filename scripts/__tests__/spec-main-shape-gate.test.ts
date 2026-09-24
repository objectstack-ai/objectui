import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

import {
  parseDiagnostics,
  renderSummary,
  declaredTypesTargets,
  satisfiesRange,
  MARKER_FILE,
} from '../spec-main-shape-gate.mjs';
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

  it('hands `inject` the objectstack checkout the spec was built in (objectui#10229)', () => {
    // Without it, a dependency the source-built spec raised (zod) has no source
    // but the published spec's store sibling, and the declarations are read
    // against a dependency they were not emitted against.
    expect(body()).toMatch(
      /node scripts\/spec-main-shape-gate\.mjs inject [^\n]*--upstream-checkout "\$UPSTREAM_CHECKOUT"/,
    );
    // The SAME directory the spec is built in, so the copy it names is the one
    // that build resolved.
    const checkout = '${{ runner.temp }}/objectstack';
    expect(body()).toContain(`UPSTREAM_CHECKOUT: ${checkout}`);
    expect(body()).toMatch(
      /working-directory: \$\{\{ runner\.temp \}\}\/objectstack\n\s*run: \|\n\s*set -euo pipefail\n\s*pnpm install --frozen-lockfile --filter @objectstack\/spec\.\.\./,
    );
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
    expect(body()).toMatch(
      /pnpm type-check --continue > "\$RUNNER_TEMP\/typecheck\.log" 2>&1\n\s*code=\$\?/,
    );
  });

  it('compiles EVERY package, so the diagnostic set is a set and not a lower bound', () => {
    // turbo stops scheduling at the first failing task unless told otherwise, so
    // without this flag the log holds the first broken package's diagnostics and
    // silence about every package turbo never asked — reported as though it were
    // the whole reading. While one long-lived break sits in the graph, every run
    // stops there and nothing else is ever measured.
    expect(
      body(),
      'without --continue this gate reports the FIRST broken package and calls it the set',
    ).toMatch(/pnpm type-check --continue/);
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

  it('attributes the GROUPED log a GitHub Actions runner actually produces', () => {
    // ⚠️ The fixture above is turbo's STREAM order, which is what a local run
    // emits. On an Actions runner turbo switches to GROUPED order: a
    // `##[group]<package>:<task>` header, output emitted BARE beneath it, and
    // the failing task announced by a colourised header with no group at all.
    // That is the ONLY order this gate ever reads, and a prefix-only parser has
    // nothing to match in it — measured on this gate's own runs, which reported
    // `src/hooks/…` for a file that lives under `packages/react/`.
    const ESC = String.fromCharCode(27);
    const groupedLog = [
      '##[group]@object-ui/sdui-parser:type-check',
      '> tsc --noEmit && tsc -p tsconfig.test.json',
      '##[endgroup]',
      `${ESC}[;31m@object-ui/react:type-check${ESC}[;0m`,
      "src/hooks/__tests__/useNavigationOverlay.modeDefault.test.tsx(76,3): error TS2322: Type 'string' is not assignable to type 'undefined'.",
    ].join('\n');
    const { rows } = parseDiagnostics(groupedLog);
    expect(rows).toHaveLength(1);
    expect(rows[0].file).toBe(
      'packages/react/src/hooks/__tests__/useNavigationOverlay.modeDefault.test.tsx',
    );

    // The firing control: the same diagnostic with its header removed must NOT
    // resolve, or the assertion above is being satisfied by something other than
    // the header it claims to read.
    const headerless = parseDiagnostics(groupedLog.split('\n').slice(-1).join('\n'));
    expect(headerless.rows[0].file).toBe(
      'src/hooks/__tests__/useNavigationOverlay.modeDefault.test.tsx',
    );
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

/**
 * objectui#10229 — the gate injected the spec's FILES but not the dependency
 * floor its manifest declares, so a spec built on zod 4.6 was read against the
 * zod 4.4 the published spec's store entry held, and the gate reported its own
 * injection as a shape break.
 *
 * These run the real CLI over a synthetic pnpm store. The script is COPIED into
 * the fixture so that its own repo root — which `inject` derives from the
 * script's location — is the fixture, never this checkout's install.
 */
describe('the injection reads the spec against the dependencies it was built with', () => {
  const made: string[] = [];
  afterEach(() => {
    for (const dir of made.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
  });

  function writePackage(dir: string, name: string, version: string): string {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version }));
    return dir;
  }

  /**
   * objectui's side: a store entry for the published spec with pnpm's RELATIVE
   * sibling links, and one workspace consumer. objectstack's side: a checkout
   * whose `packages/spec/node_modules` resolves the given versions. The tarball
   * declares `dependencies`.
   */
  function fixture(opts: {
    dependencies: Record<string, string>;
    upstream: Record<string, string | null>;
  }) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-gate-deps-'));
    made.push(root);
    const repo = path.join(root, 'objectui');
    fs.mkdirSync(path.join(repo, 'scripts'), { recursive: true });
    for (const file of ['spec-main-shape-gate.mjs', 'invoked-as.mjs']) {
      fs.copyFileSync(path.join(repoRoot, 'scripts', file), path.join(repo, 'scripts', file));
    }

    const store = path.join(repo, 'node_modules', '.pnpm');
    writePackage(path.join(store, 'zod@4.4.3', 'node_modules', 'zod'), 'zod', '4.4.3');
    writePackage(
      path.join(store, 'pg-connection-string@2.14.0', 'node_modules', 'pg-connection-string'),
      'pg-connection-string',
      '2.14.0',
    );
    const entry = path.join(store, '@objectstack+spec@17.4.0_zod@4.4.3', 'node_modules');
    const installed = writePackage(path.join(entry, '@objectstack', 'spec'), '@objectstack/spec', '17.4.0');
    fs.symlinkSync('../../zod@4.4.3/node_modules/zod', path.join(entry, 'zod'));
    fs.symlinkSync(
      '../../pg-connection-string@2.14.0/node_modules/pg-connection-string',
      path.join(entry, 'pg-connection-string'),
    );
    const consumerModules = path.join(repo, 'packages', 'app', 'node_modules', '@objectstack');
    fs.mkdirSync(consumerModules, { recursive: true });
    fs.symlinkSync(installed, path.join(consumerModules, 'spec'));

    const upstream = path.join(root, 'objectstack');
    writePackage(path.join(upstream, 'packages', 'spec'), '@objectstack/spec', '17.4.0');
    fs.mkdirSync(path.join(upstream, 'packages', 'spec', 'node_modules'), { recursive: true });
    for (const [name, version] of Object.entries(opts.upstream)) {
      if (version === null) continue;
      const copy = writePackage(
        path.join(upstream, 'node_modules', '.pnpm', `${name}@${version}`, 'node_modules', name),
        name,
        version,
      );
      fs.symlinkSync(copy, path.join(upstream, 'packages', 'spec', 'node_modules', name));
    }

    const pack = path.join(root, 'pack', 'package');
    fs.mkdirSync(path.join(pack, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(pack, 'dist', 'index.d.ts'), 'export {};\n');
    fs.writeFileSync(
      path.join(pack, 'package.json'),
      JSON.stringify({
        name: '@objectstack/spec',
        version: '17.4.0',
        exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } },
        dependencies: opts.dependencies,
      }),
    );
    const tarball = path.join(root, 'spec.tgz');
    execFileSync('tar', ['-czf', tarball, '-C', path.join(root, 'pack'), 'package']);

    const run = () =>
      spawnSync(
        'node',
        [
          path.join(repo, 'scripts', 'spec-main-shape-gate.mjs'),
          'inject',
          '--tarball',
          tarball,
          '--sha',
          'f'.repeat(40),
          '--upstream-checkout',
          upstream,
        ],
        { encoding: 'utf8', env: { ...process.env, GITHUB_STEP_SUMMARY: path.join(root, 'summary.md') } },
      );
    const summary = () => fs.readFileSync(path.join(root, 'summary.md'), 'utf8');
    return { repo, store, entry, installed, upstream, run, summary };
  }

  it('re-points an unsatisfied sibling at the copy the objectstack checkout resolved, and reports it', () => {
    const f = fixture({ dependencies: { zod: '^4.6.1' }, upstream: { zod: '4.6.1' } });
    const upstreamZod = fs.realpathSync(path.join(f.upstream, 'packages', 'spec', 'node_modules', 'zod'));

    const result = f.run();
    expect(result.status, result.stderr).toBe(0);

    // On disk: the sibling now resolves to objectstack's zod 4.6.1 ...
    expect(fs.realpathSync(path.join(f.entry, 'zod'))).toBe(upstreamZod);
    // ... and the store copy it used to point at is intact: the link was
    // replaced, nothing was deleted or written through it.
    expect(
      JSON.parse(fs.readFileSync(path.join(f.store, 'zod@4.4.3', 'node_modules', 'zod', 'package.json'), 'utf8'))
        .version,
    ).toBe('4.4.3');

    // Reported once, with the range, the old link target and the new one, in the
    // log and in the run summary.
    const lines = result.stdout.split('\n').filter((line) => line.includes('substituted zod'));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('^4.6.1');
    expect(lines[0]).toContain('zod@4.4.3 (-> ../../zod@4.4.3/node_modules/zod)');
    expect(lines[0]).toContain(`now -> ${upstreamZod} (zod@4.6.1`);
    expect(f.summary()).toContain('substituted zod');
  });

  it('proves, of every consumer, which zod the injected spec resolves', () => {
    // The "reached every consumer" proof, extended: the consumer is asked, not
    // the plan. ⛔ Asserted on the named version and path, so a reading that
    // merely printed "zod" would not pass.
    const f = fixture({ dependencies: { zod: '^4.6.1' }, upstream: { zod: '4.6.1' } });
    const upstreamZod = fs.realpathSync(path.join(f.upstream, 'packages', 'spec', 'node_modules', 'zod'));
    const result = f.run();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(`resolves zod@4.6.1 (declared ^4.6.1) for 1 consumer(s) -> ${upstreamZod}`);
    expect(result.stdout).not.toMatch(/resolves zod@4\.4\.3/);
    expect(fs.existsSync(path.join(f.installed, MARKER_FILE))).toBe(true);
  });

  it('leaves a sibling that satisfies its range exactly as installed (positive control)', () => {
    // The checkout offers copies that ALSO satisfy both ranges, so a pass that
    // re-pointed every sibling regardless would be caught here.
    const f = fixture({
      dependencies: { 'pg-connection-string': '^2.14.0', zod: '^4.4.0' },
      upstream: { 'pg-connection-string': '2.15.0', zod: '4.6.1' },
    });
    const result = f.run();
    expect(result.status, result.stderr).toBe(0);
    expect(fs.readlinkSync(path.join(f.entry, 'zod'))).toBe('../../zod@4.4.3/node_modules/zod');
    expect(fs.readlinkSync(path.join(f.entry, 'pg-connection-string'))).toBe(
      '../../pg-connection-string@2.14.0/node_modules/pg-connection-string',
    );
    expect(result.stdout).not.toContain('substituted');
    expect(result.stdout).toContain('no dependency substitution');
    expect(f.summary()).toContain('no dependency substitution');
    expect(result.stdout).toContain('resolves zod@4.4.3 (declared ^4.4.0)');
  });

  it('exits 2 naming the dependency when no copy satisfies the range, having written nothing', () => {
    for (const upstreamZod of ['4.5.0', null]) {
      const f = fixture({ dependencies: { zod: '^4.6.1' }, upstream: { zod: upstreamZod } });
      const result = f.run();
      expect(result.status, `${upstreamZod}: ${result.stdout}`).toBe(2);
      expect(result.stderr).toContain('`zod: ^4.6.1`');
      expect(result.stderr).toContain('No copy satisfying the range is available');
      // Decided before the first write: the install is exactly as it was.
      expect(fs.readlinkSync(path.join(f.entry, 'zod'))).toBe('../../zod@4.4.3/node_modules/zod');
      expect(fs.existsSync(path.join(f.installed, MARKER_FILE))).toBe(false);
    }
  });

  it('exits 2 when it is not handed an objectstack checkout at all', () => {
    const f = fixture({ dependencies: { zod: '^4.6.1' }, upstream: { zod: '4.6.1' } });
    const result = spawnSync(
      'node',
      [path.join(f.repo, 'scripts', 'spec-main-shape-gate.mjs'), 'inject', '--tarball', 'x.tgz', '--sha', 'f'],
      { encoding: 'utf8' },
    );
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('--upstream-checkout');
  });

  it('judges ranges narrowly, and refuses a spelling it does not read', () => {
    expect(satisfiesRange('4.4.3', '^4.6.1')).toBe(false);
    expect(satisfiesRange('4.6.1', '^4.6.1')).toBe(true);
    expect(satisfiesRange('5.0.0', '^4.6.1')).toBe(false);
    expect(() => satisfiesRange('4.6.1', 'workspace:*')).toThrow(/does not read/);
  });
});
