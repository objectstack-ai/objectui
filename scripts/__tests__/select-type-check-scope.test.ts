import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

import {
  FIXED_ROOT_FILES,
  globToRegExp,
  main,
  rootChanges,
  rootRule,
} from '../select-type-check-scope.mjs';

/**
 * objectui#12222 — the scope selector behind the two-speed `Type Check`.
 *
 * The selector's whole correctness is its ROOT RULE: turbo's
 * `--filter=...[<base>]` draws from the package graph, and a file that sits in
 * no package selects nothing — measured on the card for the root
 * `tsconfig.json`, the root `package.json`, `scripts/vite-*.ts` and `e2e/`,
 * every one of which every package's type-check reads or depends on. So the
 * cases below hold the rule in both directions — a root change that must widen
 * the run to the whole workspace, and a change that must not — and hold the
 * DERIVED half of the rule to turbo.json itself, so a `$TURBO_ROOT$` input
 * added to turbo.json is a root change the day it lands.
 */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const turbo = JSON.parse(fs.readFileSync(path.join(repoRoot, 'turbo.json'), 'utf8')) as {
  globalDependencies?: string[];
  tasks: Record<string, { inputs?: string[]; dependsOn?: string[] }>;
};
const RULE = rootRule(turbo);
const caught = (files: string[]): string[] => rootChanges(files, RULE).map((h: { file: string }) => h.file);

describe('select-type-check-scope — the root rule (objectui#12222)', () => {
  it('derives every $TURBO_ROOT$ input of `type-check` and `build` from turbo.json', () => {
    const derived = ['type-check', 'build'].flatMap((task) =>
      (turbo.tasks[task].inputs ?? [])
        .filter((input) => input.startsWith('$TURBO_ROOT$/'))
        .map((input) => input.slice('$TURBO_ROOT$/'.length)),
    );
    // Non-vacuity: the live turbo.json has both kinds of entry today.
    expect(derived.length, 'turbo.json declares no $TURBO_ROOT$ input at all — the derivation is reading nothing').toBeGreaterThan(5);
    const globs = new Set(RULE.map((r: { glob: string }) => r.glob));
    expect(derived.filter((g) => !globs.has(g))).toEqual([]);
  });

  it('takes the root task’s own program, because it runs only as a dependency of a selected package', () => {
    const rootDeps = (turbo.tasks['type-check'].dependsOn ?? []).filter((d) => d.startsWith('//#'));
    expect(rootDeps, '`type-check` no longer depends on a root task — this case has nothing to hold').not.toHaveLength(0);
    for (const dep of rootDeps) {
      for (const glob of turbo.tasks[dep].inputs ?? []) {
        expect(RULE.map((r: { glob: string }) => r.glob)).toContain(glob);
      }
    }
  });

  it('widens to the whole workspace for every root file the package graph cannot see', () => {
    const roots = [
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'package.json',
      'turbo.json',
      'tsconfig.json',
      'tsconfig.tier-base.json',
      'patches/some-dep@1.0.0.patch',
      'scripts/vite-crypto-stub.ts',
      'vitest.config.mts',
      'e2e/smoke.spec.ts',
      'playwright.config.ts',
      'tsconfig.e2e.json',
      // A `build` input that sits INSIDE a package: every package's build hash
      // reads it, while the package graph would only select its owner.
      'packages/sdui-parser/src/parse.ts',
    ];
    expect(caught(roots)).toEqual(roots);
  });

  it('leaves to the package graph what the package graph does see, and ignores what nothing hashes', () => {
    const notRoot = [
      'packages/plugin-kanban/src/KanbanColumnSummary.ts',
      'packages/plugin-kanban/package.json',
      'packages/plugin-kanban/tsconfig.json',
      'apps/console/src/App.tsx',
      '.changeset/12222-type-check-cache.md',
      'docs/adr/0001-example.md',
      '.github/workflows/lint.yml',
      'scripts/check-type-check-coverage.mjs',
    ];
    expect(caught(notRoot)).toEqual([]);
  });

  it('degrades to the whole workspace — never to a skip — when a root task reads the whole repository', () => {
    const noInputs = {
      tasks: {
        'type-check': { inputs: ['$TURBO_DEFAULT$'], dependsOn: ['^build', '//#type-check:e2e'] },
        build: { inputs: ['$TURBO_DEFAULT$'] },
        '//#type-check:e2e': {},
      },
    };
    const rule = rootRule(noInputs);
    expect(rootChanges(['packages/plugin-kanban/src/x.ts', 'docs/x.md'], rule)).toHaveLength(2);
  });

  it('names the fixed half of the rule in the workflow, next to the filter', () => {
    const ci = fs.readFileSync(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8');
    const at = ci.indexOf('- name: Decide which packages to type-check');
    expect(at, 'ci.yml’s type-check job no longer has the scope decision step').toBeGreaterThan(-1);
    const comment = ci.slice(ci.lastIndexOf('THE ROOT RULE', at), at);
    for (const glob of FIXED_ROOT_FILES) {
      const spelled = glob.replace(/\/\*\*$/, '/');
      expect(comment, `the root rule stated in ci.yml no longer names ${glob}`).toContain(spelled);
    }
  });

  it('refuses glob syntax it does not implement rather than guessing a match', () => {
    expect(() => globToRegExp('scripts/{a,b}.mjs')).toThrow(/does not implement/);
    expect(() => globToRegExp('!**/*.md')).toThrow(/does not implement/);
    expect(globToRegExp('node_modules/@objectstack/spec/.x.json').test('node_modules/@objectstack/spec/.x.json')).toBe(true);
    expect(globToRegExp('tsconfig*.json').test('packages/x/tsconfig.json')).toBe(false);
    expect(globToRegExp('e2e/**').test('e2e/live/a.spec.ts')).toBe(true);
  });
});

describe('select-type-check-scope — the verdict', () => {
  const run = (changed: string[], affected: () => string[] = () => ['@object-ui/plugin-kanban']) => {
    const lines: string[] = [];
    const code = main(['--base', 'abc123'], { root: repoRoot, changed, affected, log: (l: string) => lines.push(l) });
    return { code, lines };
  };

  it('answers scope=workspace on a root change, without asking turbo', () => {
    let asked = false;
    const { code, lines } = run(['pnpm-lock.yaml', 'packages/types/src/index.ts'], () => {
      asked = true;
      return [];
    });
    expect(code).toBe(0);
    expect(lines.at(-1)).toBe('scope=workspace');
    expect(lines.join('\n')).toContain('pnpm-lock.yaml');
    expect(asked).toBe(false);
  });

  it('answers scope=affected with turbo’s package list otherwise — an empty list included', () => {
    const one = run(['packages/plugin-kanban/src/KanbanColumnSummary.ts']);
    expect(one.code).toBe(0);
    expect(one.lines.at(-1)).toBe('scope=affected');
    expect(one.lines).toContain('  @object-ui/plugin-kanban');

    const none = run(['.github/workflows/lint.yml'], () => []);
    expect(none.lines.at(-1)).toBe('scope=affected');
    expect(none.lines.join('\n')).toContain('nothing to type-check');
  });

  it('reaches NO verdict when turbo cannot answer, which ci.yml reads as the whole workspace', () => {
    expect(() =>
      run(['packages/plugin-kanban/src/x.ts'], () => {
        throw new Error('Unable to query SCM');
      }),
    ).toThrow(/SCM/);
    expect(main([], { log: () => {} })).toBe(2);
  });
});

describe('ci.yml — the two speeds are wired the way the selector assumes', () => {
  const workflow = parseYaml(fs.readFileSync(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8')) as {
    jobs: Record<string, { steps: Array<{ name?: string; id?: string; run?: string; env?: Record<string, string> }> }>;
  };
  const steps = workflow.jobs['type-check'].steps;
  const decide = steps.find((s) => s.id === 'tc-scope');
  const runStep = steps.find((s) => s.name === 'Run type-check');

  it('runs the full battery, forced, on every event that is not a pull request or a queue build', () => {
    expect(decide?.run, 'the scope decision step is gone').toBeDefined();
    expect(decide?.run).toMatch(/pull_request\) base="\$PR_BASE"/);
    expect(decide?.run).toMatch(/merge_group\) base="\$QUEUE_BASE"/);
    expect(decide?.run).toMatch(/\*\)\s+echo 'scope=full'/);
    expect(runStep?.env?.TURBO_FORCE).toBe("${{ steps.tc-scope.outputs.scope == 'full' }}");
  });

  it('fails OPEN: no verdict, no base sha, or an unknown answer type-checks the whole workspace', () => {
    expect(decide?.run).toContain('node scripts/select-type-check-scope.mjs --base "$base"');
    // The catch-all branch of the verdict `case` is the whole workspace.
    expect(decide?.run).toMatch(/\*\)\s+echo "::warning::the type-check scope selector reached no verdict[^\n]*\n\s+echo 'scope=workspace'/);
    expect(decide?.run).toMatch(/if \[ -z "\$base" \]; then[\s\S]*?status=2/);
  });

  it('filters only on the affected verdict, with turbo’s own dependents filter', () => {
    expect(runStep?.run).toContain('if [ "$SCOPE" = \'affected\' ]; then');
    expect(runStep?.run).toContain('pnpm type-check "--filter=...[$BASE]"');
  });
});
