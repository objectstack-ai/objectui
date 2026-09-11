/**
 * objectui#8929 — a `**Keys:**` bullet in `.github/prompts/**` must teach keys
 * a REAL renderer answers, never keys the opt-in protocol placeholder answers.
 *
 * ## Why the obvious two pins are both worthless here
 *
 * The card that opened this gate found `view:kanban` and `view:gantt` on a
 * prompt bullet after both retired with the bare `kanban` / `gantt`
 * registrations. Two pins suggest themselves and neither would have held:
 *
 *   PIN THE TWO NAMES      a hand list that drifted once drifts again; the next
 *                          retirement is unpinned by construction.
 *   PIN AGAINST THE        `KNOWN_SCHEMA_TYPES` CONTAINS both retired keys —
 *   GENERATED KNOWN-TYPE   they are `PROTOCOL_COMPONENTS` members and
 *   LIST                   `registerPlaceholder` is a real `register(...)` call.
 *                          The pin would be green on the defect.
 *
 * So the mechanism under test is the PARTITION: the derived universe split into
 * the keys some non-placeholder site registers and the keys only the
 * placeholder module registers. Every case below drives it through the real
 * derivation over a throwaway tree, because a model of the partition would pass
 * against a partition that silently stopped partitioning.
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Plain-JS CI helpers; types are inferred from the `.mjs` sources by
// `tsconfig.scripts.json` (`allowJs`). See objectui#3494.
import {
  PLACEHOLDER_NAMESPACE,
  PROMPT_DIR,
  analyze,
  partitionRegistry,
  placeholderSites,
  promptFiles,
  scanPromptKeys,
} from '../check-prompt-component-keys.mjs';
import { INDIRECT_REGISTRATIONS, deriveRegistryKeys } from '../check-doc-component-types.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = 'scripts/check-prompt-component-keys.mjs';

interface Finding {
  file: string;
  key: string;
  reason: string;
  text: string;
}

/** Builds a throwaway tree and runs the REAL derivation/scan over it. */
function withTree<T>(build: (write: (rel: string, contents: string) => void) => void, run: (dir: string) => T): T {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-prompt-component-keys-'));
  const write = (rel: string, contents: string) => {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  };
  try {
    build(write);
    return run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** A fixture placeholder module shaped like the real one: a literal array and a
 *  helper that registers from it, so the derivation resolves it INDIRECTLY. */
const placeholderModule = (keys: string[]) =>
  [
    // The array is written multi-line on purpose: `literalArray` in the shared
    // derivation matches a collection that CLOSES on its own line, which is how
    // every real one in this repo is written.
    'const PROTOCOL_COMPONENTS = [',
    ...keys.map((k) => `  '${k}',`),
    '];',
    'function registerPlaceholder(type) {',
    `  ComponentRegistry.register(type, PlaceholderRenderer, { namespace: '${PLACEHOLDER_NAMESPACE}' });`,
    '}',
    'export function registerPlaceholders() { PROTOCOL_COMPONENTS.forEach(registerPlaceholder); }',
  ].join('\n');

const PLACEHOLDER_SITE = 'packages/components/src/renderers/placeholders.tsx';

/** The fixture's own declaration table — the thing the gate reads to learn
 *  which module the placeholders come from. */
const FIXTURE_TABLES = {
  exemptions: {},
  openRegistrationSites: {},
  indirectRegistrations: [
    {
      site: PLACEHOLDER_SITE,
      collection: 'PROTOCOL_COMPONENTS',
      kind: 'array',
      namespace: PLACEHOLDER_NAMESPACE,
      reason: 'fixture',
    },
  ],
};

const analyzeFixture = (dir: string) => analyze(dir, FIXTURE_TABLES) as { findings: Finding[]; counters: Record<string, number> };

// ── 1. the partition, which is the whole mechanism ───────────────────────────

describe('a key is authorable only when something OTHER than the placeholder registers it', () => {
  it('rejects a key the placeholder module alone registers — the defect, reproduced', () => {
    const { findings } = withTree((write) => {
      write(PLACEHOLDER_SITE, placeholderModule(['view:kanban', 'view:grid']));
      write(
        'packages/plugin-grid/src/index.tsx',
        "ComponentRegistry.register('grid', GridRenderer, { namespace: 'view' });",
      );
      write(`${PROMPT_DIR}/component.prompt.md`, '*   **Keys:** `view:grid`, `view:kanban`, etc.\n');
    }, analyzeFixture);

    expect(findings.map((f) => [f.key, f.reason])).toEqual([['view:kanban', 'placeholder-only-key']]);
  });

  it('accepts the same key once a real plugin registers it too', () => {
    // The control for the case above. Same prompt, same placeholder list; the
    // ONLY difference is a second, non-placeholder registration site. Without
    // this leg the case above would also pass against a gate that rejected
    // every `view:*` key, or every key at all.
    const { findings } = withTree((write) => {
      write(PLACEHOLDER_SITE, placeholderModule(['view:kanban', 'view:grid']));
      write(
        'packages/plugin-grid/src/index.tsx',
        [
          "ComponentRegistry.register('grid', GridRenderer, { namespace: 'view' });",
          "ComponentRegistry.register('kanban', BoardRenderer, { namespace: 'view' });",
        ].join('\n'),
      );
      write(`${PROMPT_DIR}/component.prompt.md`, '*   **Keys:** `view:grid`, `view:kanban`, etc.\n');
    }, analyzeFixture);

    expect(findings).toEqual([]);
  });

  it('reports a key nothing registers at all under its own reason', () => {
    const { findings } = withTree((write) => {
      write(PLACEHOLDER_SITE, placeholderModule(['view:grid']));
      write(
        'packages/plugin-grid/src/index.tsx',
        "ComponentRegistry.register('grid', GridRenderer, { namespace: 'view' });",
      );
      write(`${PROMPT_DIR}/component.prompt.md`, '*   **Keys:** `view:grid`, `view:board`, etc.\n');
    }, analyzeFixture);

    expect(findings.map((f) => [f.key, f.reason])).toEqual([['view:board', 'unregistered-key']]);
  });

  it('judges a BARE surviving spelling, not only namespaced ones', () => {
    // `object-kanban` is what replaced `view:kanban`. A scanner anchored on a
    // `ns:key` shape would stop reading the bullet at the moment it is
    // corrected — green forever, on a line it no longer looks at.
    const { findings, counters } = withTree((write) => {
      write(PLACEHOLDER_SITE, placeholderModule(['view:kanban']));
      write(
        'packages/plugin-kanban/src/index.tsx',
        "ComponentRegistry.register('object-kanban', Board, { namespace: 'plugin-kanban' });",
      );
      write(`${PROMPT_DIR}/component.prompt.md`, '*   **Keys:** `object-kanban`, `object-gantt`, etc.\n');
    }, analyzeFixture);

    expect(counters.keys).toBe(2);
    expect(findings.map((f) => [f.key, f.reason])).toEqual([['object-gantt', 'unregistered-key']]);
  });
});

// ── 2. the gate must not be able to pass by measuring nothing ────────────────

describe('an input it cannot read is a failure, never a pass', () => {
  const realTree = (write: (rel: string, contents: string) => void) => {
    write(PLACEHOLDER_SITE, placeholderModule(['view:kanban']));
    write('packages/plugin-grid/src/index.tsx', "ComponentRegistry.register('grid', G, { namespace: 'view' });");
    write(`${PROMPT_DIR}/component.prompt.md`, '*   **Keys:** `view:grid`, etc.\n');
  };

  it('refuses to run when no declaration names the placeholder namespace', () => {
    // The collapse that matters: with no placeholder site to subtract, the
    // partition puts EVERY registered key in the authorable half and the gate
    // silently becomes "does this key resolve" — the generous question that let
    // `view:kanban` validate green in the first place. The declaration here is
    // otherwise intact (the derivation reports nothing), so what is being tested
    // is the namespace read and not a broken fixture.
    const renamed = [{ ...FIXTURE_TABLES.indirectRegistrations[0], namespace: 'some-other-namespace' }];
    expect(() =>
      withTree(realTree, (dir) => analyze(dir, { ...FIXTURE_TABLES, indirectRegistrations: renamed })),
    ).toThrow(new RegExp(PLACEHOLDER_NAMESPACE));
  });

  it('refuses to run when the exclusion excludes nothing', () => {
    // Same collapse, reached the other way: the declaration is intact and every
    // key the placeholder module publishes — both the bare spelling and the
    // derived `protocol-placeholder:` one — is ALSO registered somewhere else,
    // so subtracting the placeholder site removes nothing at all. A run in that
    // state would ask the generous question while printing the strict verdict.
    expect(() =>
      withTree((write) => {
        write(PLACEHOLDER_SITE, placeholderModule(['view:grid']));
        write(
          'packages/plugin-grid/src/index.tsx',
          [
            "ComponentRegistry.register('view:grid', G);",
            `ComponentRegistry.register('${PLACEHOLDER_NAMESPACE}:view:grid', G);`,
          ].join('\n'),
        );
        write(`${PROMPT_DIR}/component.prompt.md`, '*   **Keys:** `view:grid`, etc.\n');
      }, analyzeFixture),
    ).toThrow(/removed no keys at all/);
  });

  it('refuses to run when the prompt surface has no Keys bullet left', () => {
    expect(() =>
      withTree((write) => {
        write(PLACEHOLDER_SITE, placeholderModule(['view:kanban']));
        write('packages/plugin-grid/src/index.tsx', "ComponentRegistry.register('grid', G, { namespace: 'view' });");
        write(`${PROMPT_DIR}/component.prompt.md`, '# no bullets here\n\nSome prose about `view:kanban`.\n');
      }, analyzeFixture),
    ).toThrow(/Keys/);
  });

  it('refuses to run when the registry derivation itself reported a finding', () => {
    expect(() =>
      withTree((write) => {
        write(PLACEHOLDER_SITE, placeholderModule(['view:kanban']));
        write('packages/plugin-grid/src/index.tsx', "ComponentRegistry.register('grid', G, { namespace: 'view' });");
        // A dynamic key the derivation cannot resolve and no table declares.
        write('packages/plugin-x/src/index.tsx', 'ComponentRegistry.register(manifest.type, X);');
        write(`${PROMPT_DIR}/component.prompt.md`, '*   **Keys:** `view:grid`, etc.\n');
      }, analyzeFixture),
    ).toThrow(/incomplete/);
  });

  it('reads keys from the Keys LINE only, so prose about props is not judged as keys', () => {
    const { counters } = withTree((write) => {
      write(PLACEHOLDER_SITE, placeholderModule(['view:kanban']));
      write('packages/plugin-grid/src/index.tsx', "ComponentRegistry.register('grid', G, { namespace: 'view' });");
      write(
        `${PROMPT_DIR}/component.prompt.md`,
        ['*   **Keys:** `view:grid`, etc.', '    *   the `wizard` presentation is a `formType` prop.'].join('\n'),
      );
    }, analyzeFixture);

    expect(counters.keys).toBe(1);
  });
});

// ── 3. the live tree ─────────────────────────────────────────────────────────

describe('the repository this gate guards', () => {
  it('has a placeholder declaration for the gate to read', () => {
    expect([...placeholderSites(INDIRECT_REGISTRATIONS)]).not.toEqual([]);
  });

  it('really does have placeholder-only keys — otherwise every case above tests nothing', () => {
    const { keys } = deriveRegistryKeys(repoRoot);
    const { authorable, placeholderOnly } = partitionRegistry(keys, placeholderSites(INDIRECT_REGISTRATIONS));
    expect(placeholderOnly.size).toBeGreaterThan(0);
    expect(authorable.size).toBeGreaterThan(0);
    // A strict subset, not an equal set: the exclusion must actually remove
    // something on the LIVE tree, not only on a fixture built to make it.
    expect(authorable.size).toBeLessThan(keys.size);
  });

  it('has a prompt surface with Keys bullets in it', () => {
    expect(promptFiles(repoRoot).length).toBeGreaterThan(0);
    expect(scanPromptKeys(repoRoot).bullets).toBeGreaterThan(0);
  });

  it('passes — every key the prompts teach is answered by a real renderer', () => {
    expect((analyze(repoRoot) as { findings: Finding[] }).findings).toEqual([]);
  });
});

// ── 4. wiring: a check nothing runs is not a gate ────────────────────────────

describe('wiring', () => {
  const workflowDir = path.join(repoRoot, '.github/workflows');
  const yamlOf = (file: string) =>
    fs
      .readFileSync(path.join(workflowDir, file), 'utf8')
      .split('\n')
      .filter((line) => !/^\s*#/.test(line))
      .join('\n');
  const workflowFiles = fs.readdirSync(workflowDir).filter((f) => f.endsWith('.yml'));
  const homes = workflowFiles.filter((f) => yamlOf(f).includes(SCRIPT));

  it('is exposed as a root package script', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['check:prompt-keys']).toBe(`node ${SCRIPT}`);
  });

  it('has exactly one home, and that workflow gates pull requests', () => {
    expect(homes.length, 'one gate, one home').toBe(1);
    const yaml = yamlOf(homes[0]);
    expect(yaml).toMatch(/^\s*pull_request:/m);
    expect(yaml).toMatch(/^\s*push:/m);
    expect(yaml).toMatch(/^\s*merge_group:/m);
  });

  it('runs unfiltered — the change that breaks it is a markdown-only change', () => {
    // `ci.yml`'s type-check job decides whether to run with a diff that excludes
    // `'**/*.md'`, and `.github/prompts/**` is nothing but `.md`. Behind a paths
    // filter this gate would be blind to the only PR shape that can break it.
    const yaml = yamlOf(homes[0]);
    expect(yaml, `${homes[0]} runs ${SCRIPT} behind a paths-ignore`).not.toMatch(/paths-ignore:/);
    expect(yaml, `${homes[0]} runs ${SCRIPT} behind a paths filter`).not.toMatch(/^\s+paths:/m);
  });

  it('needs no install, so it can afford to run unfiltered', () => {
    const yaml = yamlOf(homes[0]);
    expect(yaml).not.toContain('pnpm install');
    expect(yaml).not.toContain('corepack');

    // Walk the WHOLE static import graph, not just this gate's first line: it
    // imports a sibling gate, and "needs no node_modules" has to stay true of
    // everything it reaches, not of its own header.
    const seen = new Set<string>();
    const external: string[] = [];
    const walk = (abs: string) => {
      if (seen.has(abs)) return;
      seen.add(abs);
      const source = fs.readFileSync(abs, 'utf8');
      for (const m of source.matchAll(/^import .* from '([^']+)';$/gm)) {
        const spec = m[1];
        if (spec.startsWith('node:')) continue;
        if (!spec.startsWith('.')) {
          external.push(`${path.relative(repoRoot, abs)} -> ${spec}`);
          continue;
        }
        walk(path.resolve(path.dirname(abs), spec));
      }
    };
    walk(path.join(repoRoot, SCRIPT));

    expect(seen.size, 'the import walk read only the gate itself — it followed nothing').toBeGreaterThan(1);
    expect(external, `the gate's import graph reaches a package, so it needs an install: ${external}`).toEqual([]);
  });
});
