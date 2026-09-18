/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Pins for `scripts/body-dialect-census.mjs` (objectui#6771, ruling step 1).
 *
 * Two things are pinned here, and they fail for different reasons:
 *
 * 1. **The instrument.** Every assertion in the first block corresponds to a
 *    bug the first draft of the census actually had, and each one failed the
 *    same way: it returned a SILENT ZERO with exit 0. A census that reads zero
 *    because it is blind is indistinguishable from a corpus that is clean —
 *    which is the exact failure mode the card's own history is made of.
 *
 * 2. **The population.** The `body`-only key list is read back off the renderer
 *    sources, so it cannot go stale the way the card body's "10" did. If
 *    someone teaches `badge` to read `children`, or adds a `sidebar-*`
 *    registration, this goes red rather than the census quietly measuring the
 *    wrong set.
 */

import { afterAll, describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import {
  census,
  scanNodes,
  keepFencedCodeOnly,
  resolvePopulation,
  parseKeys,
  finalVerdict,
  ALL_KEYS,
  KNOWN_LIMITS,
  EXIT_UNREADABLE,
  BODY_ONLY,
  RULED_BUT_NOT_A_READER,
  BODY_ONLY_UNRULED,
} from '../body-dialect-census.mjs';

const REPO_ROOT = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(REPO_ROOT, p), 'utf8');

/**
 * `read`, with whole-line comments removed.
 *
 * ⚠️ Measured, not hypothetical. `providers/SchemaValidator.ts` documents its
 * child-list arm by QUOTING `schema.children || schema.body` in a comment
 * directly above the line that implements it. A plain `toContain` over the raw
 * file therefore stayed green with that implementation ablated away — the
 * assertion was passing off the prose, which is the phantom-check shape this
 * file's own neighbours warn about: an assertion that cannot fail is not a pin.
 *
 * Only WHOLE-LINE comments are stripped, so a `//` inside a string survives —
 * a URL, or the preview provider's inlined webview script, both of which appear
 * in the files these blocks read.
 */
const readCode = (p: string) =>
  read(p)
    .split('\n')
    .filter((line) => {
      const trimmed = line.trimStart();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
    })
    .join('\n');

const keysOf = (text: string, type: string) => {
  const node = scanNodes(text).find((n: { type: string }) => n.type === type);
  return node ? [...(node.keys as Set<string>)] : null;
};

describe('the scanner sees the shapes authored metadata actually uses', () => {
  it('reads QUOTED keys — the JSON corpus is the whole point', () => {
    // REGRESSION: the first draft consumed a quoted key as a string value
    // before ever testing it as a key, because the string branch ran first.
    // JSON spells every key quoted, so the entire `.json` corpus — including
    // the four authored sidebar fixtures that turned out to hold 56 of the 56
    // `body` nodes in this repo — read as ZERO. Exit 0, no error, no hint.
    expect(keysOf('{"type": "badge", "body": []}', 'badge')).toEqual(['type', 'body']);
    expect(keysOf("{ type: 'badge', body: [] }", 'badge')).toEqual(['type', 'body']);
  });

  it('attributes a child key to the node that owns it, not to an ancestor', () => {
    // `body` two levels down belongs to the inner node. Without this, one
    // authored `body` would score against every enclosing node as well.
    const text = '{"type":"card","children":[{"type":"badge","body":[]}]}';
    expect(keysOf(text, 'card')).toEqual(['type', 'children']);
    expect(keysOf(text, 'badge')).toEqual(['type', 'body']);
  });

  it('does NOT score a key that only appears in a comment — prose is not a call site', () => {
    expect(scanNodes("// a node written { type: 'badge', body: [] }\n")).toEqual([]);
    expect(scanNodes("/* { type: 'badge', body: [] } */")).toEqual([]);
  });

  it('survives a regex literal after `=>`, which otherwise blinds the rest of the file', () => {
    // REGRESSION: `/^ {3}\S.*\(type "/` in a real test file was not recognised
    // as a regex because `>` was missing from the "value position" set. Its `{`
    // opened a phantom object frame and its lone `"` opened a runaway string,
    // so every node AFTER it vanished — the file scored 0 of its 3 nodes.
    const text = String.raw`
      const f = (l) => /^ {3}\S.*\(type "/.test(l);
      const node = { type: 'badge', body: [] };
    `;
    expect(keysOf(text, 'badge')).toEqual(['type', 'body']);
  });

  it('keeps Markdown fenced code and drops Markdown prose', () => {
    // REGRESSION: a ```json fence is THREE backticks. The scanner treats a
    // backtick as a template-literal delimiter, so the first two paired off and
    // the third swallowed the whole snippet — EVERY doc example read as zero.
    // That population is not incidental: ruling step 5 migrates the teaching
    // corpus in the same commit.
    const md = ['Prose mentioning `type: "badge"` inline.', '', '```json', '{ "type": "badge", "body": [] }', '```', ''].join('\n');
    const kept = keepFencedCodeOnly(md);
    expect(keysOf(kept, 'badge')).toEqual(['type', 'body']);
    // …and the prose mention is gone, not counted.
    expect(kept).not.toContain('Prose mentioning');
    // Line numbers survive the blanking, so reported positions stay true.
    expect(kept.split('\n').length).toBe(md.split('\n').length);
  });

  it('CONTROL — a corpus-shaped input returns hits, so a zero elsewhere is readable', () => {
    // Without this, every "0" in the census is indistinguishable from a
    // scanner that resolved nothing at all.
    const nodes = scanNodes(read('examples/schema-catalog/src/schemas/components-basic-sidebar/basic-sidebar.json'));
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.filter((n: { keys: Set<string> }) => n.keys.has('body')).length).toBeGreaterThan(0);
  });
});

describe('the measured population is read off the renderers, not off the card body', () => {
  const sidebarSrc = () => read('packages/components/src/renderers/navigation/sidebar.tsx');

  it('`BODY_ONLY` is 12 keys — the ruled 13 minus `sidebar-trigger`', () => {
    // The card body says 10 and the ruling's step 2 repeats it; the census pin
    // in `container-declaration-ratchet.test.tsx` says 13. Both are counts of
    // slightly different things. What the retirement actually costs is measured
    // per RENDERER READ, and that set is 12.
    expect(BODY_ONLY.length).toBe(12);
    expect(BODY_ONLY).toContain('badge');
    expect(BODY_ONLY).toContain('alert');
    // The bare family name is present. A `sidebar-[a-z-]+` pattern REQUIRES a
    // suffix and silently drops it — the original miscount, recorded on the
    // card 2026-08-29, and the census query has the same shape.
    expect(BODY_ONLY).toContain('sidebar');
    expect(BODY_ONLY.filter((k) => k.startsWith('sidebar')).length).toBe(10);
  });

  it('`badge` and `alert` read `body` and never `children`', () => {
    for (const [file, type] of [
      ['packages/components/src/renderers/data-display/badge.tsx', 'badge'],
      ['packages/components/src/renderers/data-display/alert.tsx', 'alert'],
    ] as const) {
      const src = read(file);
      expect(src, `${type} stopped reading schema.body`).toContain('renderChildren(schema.body)');
      expect(src, `${type} now reads schema.children — it is no longer body-only`).not.toContain('schema.children');
    }
  });

  it('`sidebar-trigger` is ruled but reads NO child list, so retirement costs it nothing', () => {
    expect(RULED_BUT_NOT_A_READER).toEqual(['sidebar-trigger']);
    const src = sidebarSrc();
    // It is registered…
    expect(src).toContain("ComponentRegistry.register('sidebar-trigger'");
    // …and there are exactly 10 `renderChildren(schema.body)` reads across the
    // 11 `sidebar-*` registrations. The one without is `sidebar-trigger`, whose
    // renderer never receives `schema` at all.
    expect(src.match(/ComponentRegistry\.register\('sidebar/g)?.length).toBe(11);
    expect(src.match(/renderChildren\(schema\.body\)/g)?.length).toBe(10);
    const trigger = src.slice(src.indexOf("register('sidebar-trigger'"));
    expect(trigger).not.toContain('schema.body');
    expect(trigger).not.toContain('schema.children');
  });

  it('⚠️ `tooltip` is a `body`-only reader that the ruled 13 does NOT include', () => {
    // Measured, and it matters: `tooltip` renders `renderChildren(schema.body)`
    // and never `schema.children`, so direction B removes its only rich-content
    // key too — yet it is absent from the ruling's step 2 list. It is also the
    // ONE registration in the tree that DECLARES `body` as an authorable input,
    // which makes it the most discoverable spelling of `body` on the whole
    // authoring surface.
    expect(BODY_ONLY_UNRULED).toEqual(['tooltip']);
    const src = read('packages/components/src/renderers/overlay/tooltip.tsx');
    expect(src).toContain('renderChildren(schema.body)');
    expect(src).not.toContain('schema.children');
    expect(src).toMatch(/name:\s*'body'/);
  });

  it('the two published keys are exactly `badge` and `alert`', () => {
    // ADR-0080's allow-list. Retiring `body` on these two is a reject-direction
    // change on PUBLISHED contract; on the 11 bare `sidebar-*` it is internal.
    // `PUBLIC_BLOCKS` carries the namespaced `page:sidebar`, a different type —
    // so grepping the list for "sidebar" would wrongly score the bare family.
    const src = read('packages/core/src/registry/public-blocks.ts');
    expect(src).toMatch(/^\s*'badge',$/m);
    expect(src).toMatch(/^\s*'alert',$/m);
    expect(src).toMatch(/^\s*'page:sidebar',$/m);
    for (const key of BODY_ONLY.filter((k) => k.startsWith('sidebar'))) {
      expect(src, `bare \`${key}\` became public — the census cost split changed`).not.toMatch(
        new RegExp(`^\\s*'${key}',$`, 'm'),
      );
    }
  });
});

describe('the census stays re-runnable', () => {
  it('is wired into the root package.json, like every other script here', () => {
    // A census that gates a multi-day retirement has to be repeatable after the
    // next corpus change, by someone who was not here. Same convention as the
    // `check:*` gates: the entry point is pinned, not just documented.
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    expect(pkg.scripts['census:body-dialect']).toBe('node scripts/body-dialect-census.mjs');
  });
});

describe('the `body` consumers the ruling does not enumerate', () => {
  it('three generic readers outside the renderer tree still resolve `body`', () => {
    // Recorded because ruling steps 2-5 name renderers, the published type and
    // the tier — and these three are none of those. They read `body` for ANY
    // node type, so they outlive the per-registration convergence and would
    // keep the dialect alive after step 2 lands.
    //
    // ⚠️ The three were NOT alike, and the difference decided objectui#7181.
    // Core has always been `children`-first, so it degrades gracefully. The two
    // vscode readers guarded on `schema.body` ALONE — they did not resolve
    // `children` at all — so they did not merely keep the old dialect alive,
    // they BLOCKED the producers from moving: a `children`-spelled document
    // rendered blank and had its children skipped by validation, silently.
    // objectui#7181 converged both onto the core spelling, adding the
    // `children` arm and KEEPING `body`. Nothing was retired; that is step 2.
    //
    // ⇒ all three now read the same way, which is what these three assertions
    // pin. The `body` arm surviving in each is the half that says step 2 is
    // still outstanding.
    for (const reader of [
      'packages/core/src/validation/schema-validator.ts',
      'packages/vscode-extension/src/providers/SchemaValidator.ts',
      'packages/vscode-extension/src/providers/PreviewProvider.ts',
    ]) {
      expect(readCode(reader), reader).toContain('schema.children || schema.body');
    }
  });

  it('the platform SHIPS the dialect it is being asked to refuse', () => {
    // The sharpest census finding, and the claim is UNCHANGED for the second
    // time: ruling step 5's principle is that "the platform never refuses a
    // spelling it still ships", so step 4 (tier teaches `children` only) cannot
    // land while any PRODUCER still emits `body` into metadata a user then owns.
    //
    // What moves each round is the SUBJECT, never the claim. objectui#7181
    // migrated the six producers its table named — `objectui init`, the VS Code
    // extension's new-file templates, the three `defaultProps` registrations
    // and the runner's fallback page. objectui#9847 migrated the SEVENTH that
    // table never listed: `generatePage` in
    // `packages/cli/src/commands/generate.ts`, which scaffolded a
    // `pages/NAME.json` whose child list was spelled `body`.
    //
    // ⛔ Deliberately NOT inverted into "the producers now carry `children`".
    // That would assert the migrating branch's own diff back at itself and
    // discard the ordering rationale this block exists to carry — refused by
    // objectui#7181's repair round, and refused again by objectui#9847's.
    const migrated = [
      'packages/cli/src/commands/init.ts',
      'packages/cli/src/commands/generate.ts',
      'packages/vscode-extension/src/extension.ts',
      'packages/components/src/renderers/complex/carousel.tsx',
      'packages/components/src/renderers/complex/resizable.tsx',
      'packages/components/src/renderers/complex/scroll-area.tsx',
      'packages/runner/src/App.tsx',
    ];

    for (const producer of migrated) {
      const text = readCode(producer);
      // Lit control first: without a child list present at all, the absence
      // assertion beside it would hold over an empty or unreadable file.
      expect(text, producer).toContain('children:');
      expect(text, producer).not.toContain('body:');
    }

    // ⭐ What objectui#9847 established, taken from the instrument rather than
    // from its own diff: across the whole tree the census now reaches NO
    // `body`-spelled child list in its `app-metadata` bucket — the bucket that
    // holds shipped source. Asserted as a population, so a producer arriving in
    // a file nobody listed reds this without anyone extending the list above.
    const { filesScanned, hits } = census(REPO_ROOT);
    const carryingBody = hits.filter((hit: { body: boolean }) => hit.body);

    // Two lit controls, because a blind walk satisfies the zero below on its
    // own — this file's first block exists for that exact failure.
    expect(filesScanned, 'the census walked nothing').toBeGreaterThan(0);
    expect(
      carryingBody.length,
      'the census reaches no `body` node ANYWHERE — it has gone blind, or the ' +
        'teaching corpus and example apps that ruling step 5 migrates are gone'
    ).toBeGreaterThan(0);

    expect(
      carryingBody
        .filter((hit: { bucket: string }) => hit.bucket === 'app-metadata')
        .map((hit: { file: string; line: number }) => `${hit.file.split('\\').join('/')}:${hit.line}`)
    ).toEqual([]);

    // ⛔ That zero is NOT the answer to "is step 4 landable", and reading it as
    // one is the trap this half exists to close. The census states its own
    // limits and TWO of them hide a producer: it scores a child list only on an
    // object that also carries a string-LITERAL `type` (a `tabs` ITEM carries
    // `label`/`value`/`body` and no `type`), and it never reads inside a string
    // or a template literal (a VS Code completion snippet is a string). Both
    // shapes are live in shipped source today, so the claim in this test's name
    // is still TRUE — with a third subject, and step 4 is still not landable.
    //
    // ⭐ When either assertion below reds, that is the HANDOFF, not a
    // regression: re-point this block at whatever still ships the dialect — or,
    // once nothing does, say so here in these terms, which is the day step 4
    // becomes landable. ⛔ Do not delete the claim to make the block green.

    // Inserted into the user's own document the moment the completion is
    // accepted, which is the most direct form a producer takes: the author does
    // not even type the spelling.
    const completion = readCode('packages/vscode-extension/src/providers/CompletionProvider.ts');
    expect(completion, 'lit control — the snippet table is being read at all').toContain(
      '"className": "$1"'
    );
    expect(completion).toContain('"body": {');

    // A shipped `defaultProps` child list, the same construct as the three
    // registrations objectui#7181 moved — spelled on a tab ITEM, where the
    // renderer's canonical key is `content`. ⛔ Whether it belongs to
    // objectui#6771's ruled family is NOT decided here; that it still ships the
    // spelling is what is asserted.
    const tabs = readCode('packages/components/src/renderers/layout/tabs.tsx');
    expect(tabs, 'lit control — the defaultProps block is being read at all').toContain(
      'defaultProps:'
    );
    expect(tabs).toMatch(/value:\s*'tab1',\s*body:\s*\[/);
  });
});

/**
 * The census walk does not descend into `.objectui-tmp` (objectui#9201).
 *
 * This walk starts at `--root` (default the repo root) and descends
 * dot-directories — it reports hits inside `.changeset/`, which is how the
 * reach was measured rather than assumed. `.objectui-tmp` is the CLI test's
 * LIVE scratch directory: a generated app is mkdtemp'd under it and removed in
 * a `finally`, so anything found there is tooling output that exists for the
 * span of one test, never corpus. Same class as `test-results` and
 * `playwright-report`, which this skip list already carries.
 *
 * ⚠️ Two-sided on purpose. The same bytes are planted twice, and the lit half
 * is not decoration: a census that walked NOTHING would satisfy the exclusion
 * assertion on its own, and a silent zero with exit 0 is the exact failure
 * this file's first block was written against.
 */
describe('the census skips `.objectui-tmp` (objectui#9201)', () => {
  const roots: string[] = [];
  afterAll(() => {
    for (const root of roots) rmSync(root, { recursive: true, force: true });
  });

  const NODE = JSON.stringify({ type: 'page', body: [{ type: 'text', text: 'x' }] }, null, 2) + '\n';

  it('finds a planted node in a scanned directory and NOT the same bytes under `.objectui-tmp/`', () => {
    const root = mkdtempSync(join(tmpdir(), 'body-dialect-census-9201-'));
    roots.push(root);
    for (const rel of ['packages/scanned-control/page.json', '.objectui-tmp/tsc-gate-0000-AAAAAA/page.json']) {
      const full = join(root, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, NODE);
    }

    const files = census(root).hits.map((hit) => hit.file.split('\\').join('/'));

    // Lit control — without this the assertion below passes on an empty walk.
    expect(files).toContain('packages/scanned-control/page.json');
    expect(files.some((file) => file.startsWith('.objectui-tmp/'))).toBe(false);
  });
});

/**
 * A zero names the population it was taken over (objectui#9545).
 *
 * The defect: the scan filtered every node against a hard-coded name set and
 * threw the set away before printing, so `hits: 0` for a name OUTSIDE it was
 * indistinguishable from a real zero. It was hit for real — a
 * breaking-change census over six narrowed names read zero from this tool, and
 * the only way to take the real reading was to patch the name list in a
 * scratchpad copy of the script.
 *
 * ⚠️ Every assertion below is two-sided, for the same reason the first
 * block of this file is: an instrument that resolved NOTHING satisfies a bare
 * "reads 0" assertion on its own. The lit half is not decoration.
 */
describe('the population travels with the reading (objectui#9545)', () => {
  const roots: string[] = [];
  afterAll(() => {
    for (const root of roots) rmSync(root, { recursive: true, force: true });
  });

  /** A corpus with one IN-population node and one OUT-of-population node. */
  const plantedRoot = () => {
    const root = mkdtempSync(join(tmpdir(), 'body-dialect-census-9545-'));
    roots.push(root);
    const full = join(root, 'packages/planted/page.json');
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(
      full,
      JSON.stringify({ type: 'page', body: [{ type: 'text', body: [] }] }, null, 2) + '\n',
    );
    return root;
  };

  it('DIFFERENTIAL — the same bytes read 0 or non-zero depending only on the population', () => {
    const root = plantedRoot();

    const dflt = census(root);
    const inPopulation = dflt.hits.filter((h: { type: string }) => h.type === 'page');
    const outOfPopulation = dflt.hits.filter((h: { type: string }) => h.type === 'text');
    // Lit control: the walk resolved something, so the zero below is about the
    // population and not about a blind instrument.
    expect(inPopulation.length).toBeGreaterThan(0);
    expect(outOfPopulation.length).toBe(0);

    // Same root, same bytes, population named explicitly — the "zero" was an artifact.
    const asked = census(root, { keys: ['text', 'page'] });
    expect(asked.hits.filter((h: { type: string }) => h.type === 'text').length).toBeGreaterThan(0);
    expect(asked.hits.filter((h: { type: string }) => h.type === 'page').length).toBe(inPopulation.length);
  });

  it('the reading CARRIES the key set it was taken over, so the zero is readable', () => {
    const root = plantedRoot();
    const dflt = census(root);
    expect(dflt.population.keySource).toBe('default');
    expect(dflt.population.keys).toEqual([...ALL_KEYS].sort());
    // The fact a reader of the zero above needs, present in the payload itself.
    expect(dflt.population.keys).not.toContain('text');
    expect(dflt.population.keys).toContain('page');

    const asked = census(root, { keys: ['text', 'page'] });
    expect(asked.population.keySource).toBe('--keys');
    expect(asked.population.keys).toEqual(['page', 'text']);
  });

  it('names keys with no renderer evidence rather than REFUSING them', () => {
    // The card offered "exit non-zero on a name outside the list" as an option.
    // Refusing would delete the measurement this card was filed over: the six
    // narrowed names are deliberately NOT reader keys and asking about them is
    // the legitimate question. So an unknown key is NAMED, not refused.
    const p = resolvePopulation(['text', 'badge']);
    expect(p.unknownKeys).toEqual(['text']);
    expect(finalVerdict({ population: p, filesScanned: 1 }).exit).toBe(0);
    // Lit control — a key with renderer evidence is not named as unknown.
    expect(resolvePopulation(['badge']).unknownKeys).toEqual([]);
  });

  it('`--keys` with a missing value REFUSES rather than silently using the default set', () => {
    // The defect one level up: answering a question about one key set with a
    // count taken over a different one. `undefined` (flag absent) and `[]`
    // (flag present, value missing) must not collapse.
    expect(parseKeys(['--root', '.'])).toBeUndefined();
    expect(parseKeys(['--keys', '--json'])).toEqual([]);
    expect(parseKeys(['--keys', 'text,image', '--keys', 'icon'])).toEqual(['text', 'image', 'icon']);
    expect(parseKeys(['--keys', ' text , image '])).toEqual(['text', 'image']);
  });

  it('refuses the two zeros that naming the population cannot make readable', () => {
    const empty = finalVerdict({ population: resolvePopulation([]), filesScanned: 99 });
    expect(empty.exit).toBe(EXIT_UNREADABLE);
    expect(empty.refusal?.join(' ')).toContain('Empty key population');

    const blind = finalVerdict({ population: resolvePopulation(undefined), filesScanned: 0 });
    expect(blind.exit).toBe(EXIT_UNREADABLE);
    expect(blind.refusal?.join(' ')).toContain('Zero files scanned');

    // Lit control, and the point of the whole card: a REAL zero over a real
    // population on a real corpus is a legitimate reading and is NOT refused.
    const honest = finalVerdict({ population: resolvePopulation(['text']), filesScanned: 99 });
    expect(honest.exit).toBe(0);
    expect(honest.refusal).toBeNull();
  });

  it('the header\'s "stated so a zero is readable" promise is EMITTED, not just written', () => {
    // The limits are one declaration, emitted by the run. A prose list beside a
    // machine-maintained one is how the key-population limit came to be missing
    // from the header in the first place.
    const ids = KNOWN_LIMITS.map((l: { id: string }) => l.id);
    expect(ids).toContain('key-population');
    expect(new Set(ids).size).toBe(ids.length);
    for (const limit of KNOWN_LIMITS) expect(limit.what.length).toBeGreaterThan(0);
    expect(resolvePopulation(undefined).notScanned).toBe(KNOWN_LIMITS);

    // The old prose bullets named a `--group` flag this script has never had.
    const src = read('scripts/body-dialect-census.mjs');
    expect(src, 'the header names a flag that does not exist').not.toContain('--group');
  });

  it('CLI — the payload always carries the population, and a refusal reaches the exit code', () => {
    const script = join(REPO_ROOT, 'scripts', 'body-dialect-census.mjs');
    const run = (args: string[]) =>
      spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

    // Lit control: a real run exits 0 and its payload names the population.
    const ok = run(['--root', plantedRoot(), '--json']);
    expect(ok.status).toBe(0);
    const payload = JSON.parse(ok.stdout) as {
      population: { keys: string[]; notScanned: Array<{ id: string }> };
      hits: unknown[];
    };
    expect(payload.population.keys.length).toBeGreaterThan(0);
    expect(payload.population.notScanned.map((l) => l.id)).toContain('key-population');

    // ⭐ There is no spelling of this payload that reports `hits` without
    // reporting what `hits` was counted over: no flag suppresses it.
    expect(Object.keys(payload)).toContain('population');

    // A blind walk exits non-zero with nothing on stdout, where it used to
    // print a full table of confident zeros and exit 0.
    const blind = run(['--root', join(REPO_ROOT, 'no-such-directory-9545'), '--json']);
    expect(blind.status).toBe(EXIT_UNREADABLE);
    expect(blind.stdout).toBe('');
    expect(blind.stderr).toContain('Zero files scanned');
  });
});
