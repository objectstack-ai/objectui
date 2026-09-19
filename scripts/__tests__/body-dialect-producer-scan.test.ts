/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Pins for `scripts/body-dialect-producer-scan.mjs` (objectui#9871).
 *
 * ⭐ The differential control in this file is THE OTHER INSTRUMENT. Most blocks
 * plant one corpus and run BOTH `scripts/body-dialect-census.mjs` and the
 * producer scan over it, asserting they DISAGREE — because "the scan sees more"
 * is the claim, and a scan asserted only against itself cannot fail that way.
 *
 * ⛔ The value each ablation and each differential is taken on is deliberately
 * NOT the headline one. A `body` on an object that already carries a
 * string-literal `type` is a value both implementations agree about, so a test
 * built on it is green on the census's classifier and on this one alike. The
 * values here are the ones they disagree about: a `body` on an object with NO
 * `type`, and a `body` spelled INSIDE a string literal.
 */

import { afterAll, describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import {
  scan,
  deriveReaders,
  producersOf,
  unchannelledOf,
  passesC2,
  dispositionOf,
  valueKindAt,
  finalVerdict,
  walkFrames,
  enclosingScope,
  CRITERION,
  NOT_A_PRODUCER,
  KNOWN_LIMITS,
  EMISSION_CHANNELS,
  CANDIDATE_FILE,
  DECLARATION_SEGMENTS,
  DATA_VALUE_KINDS,
  EXIT_UNREADABLE,
} from '../body-dialect-producer-scan.mjs';
import { census } from '../body-dialect-census.mjs';
import { scanSource, blank } from '../js-comment-mask.mjs';

const REPO_ROOT = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(REPO_ROOT, p), 'utf8');

const roots: string[] = [];
afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

/**
 * A planted tree. Every corpus needs a READER too: C2 is applied, not assumed,
 * so a corpus with no reader is refused rather than reported as empty — which
 * is itself pinned below.
 */
const READER_FILE = `
import { renderChildren } from '../../lib/utils';
export const Sidebar = ({ schema }) => <div>{renderChildren(schema.body)}</div>;
export const Tabs = ({ schema }) => schema.items?.map((item) => renderChildren(item.content || (item as any).body));
`;

function plant(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'body-dialect-producer-9871-'));
  roots.push(root);
  const all = { 'packages/reader/src/readers.tsx': READER_FILE, ...files };
  for (const [rel, text] of Object.entries(all)) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text);
  }
  return root;
}

describe('⭐ B1 — the classifier does NOT require a sibling `type`', () => {
  /**
   * The census scores a child list only on an object that also carries a
   * string-literal `type`. A tab ITEM carries `label` / `value` / `body` and no
   * `type`, so it is PERMANENTLY invisible to that key — not missed, unreachable.
   */
  const ITEM_PRODUCER = `
import { ComponentRegistry } from '@object-ui/core';
ComponentRegistry.register('tabs', TabsRenderer, {
  defaultProps: {
    items: [
      { label: 'Tab 1', value: 'tab1', body: [{ type: 'text', content: 'x' }] },
    ],
  },
});
`;

  it('DIFFERENTIAL — the census reads 0 on the item and the scan reads it as a producer', () => {
    const root = plant({ 'packages/widget/src/tabs.tsx': ITEM_PRODUCER });

    // ── The census, over the same bytes ──────────────────────────────────
    const censusRun = census(root);
    // Lit control FIRST: the census walked this tree and resolved the INNER
    // node, so its zero below is about its classifier and not about a blind
    // walk. Without this the assertion after it passes on an empty scan.
    expect(censusRun.filesScanned).toBeGreaterThan(0);
    expect(censusRun.hits.filter((h: { type: string }) => h.type === 'text').length).toBe(0);
    const censusOnItem = censusRun.hits.filter(
      (hit: { file: string; body: boolean }) => hit.file.includes('tabs') && hit.body,
    );
    expect(censusOnItem).toEqual([]);

    // ── The producer scan, same bytes, same command ──────────────────────
    const run = scan(root);
    const producers = producersOf(run.hits, run.readers);
    expect(producers.map((p: { carrier: string }) => p.carrier)).toEqual(['item']);
    expect(producers[0].line).toBe(6);
    expect(producers[0].channel).toBe('default-props');
  });

  it('`type` is a CARRIER FACT, never an admission test — and any value counts', () => {
    // The census requires a string LITERAL `type`. Here the value is an
    // identifier, so the census leaves the frame unscored; the carrier is still
    // recorded as a node because the key is present.
    const text = '{ type: SOME_CONST, body: [] }';
    const { comment, literal } = scanSource(text);
    const { hits } = walkFrames(blank(text, comment), literal);
    expect(hits).toHaveLength(1);
    expect(hits[0].hasType).toBe(true);
    expect(hits[0].nodeType).toBeNull();
    // Lit control — a string-literal `type` still resolves its value.
    const lit = '{ type: "badge", body: [] }';
    const f = scanSource(lit);
    expect(walkFrames(blank(lit, f.comment), f.literal).hits[0].nodeType).toBe('badge');
  });
});

describe('⭐ B2 — the scanner READS INSIDE string and template literals', () => {
  const SNIPPET_PRODUCER = `
export class CompletionProvider {
  provide() {
    const common = [{ name: 'body', desc: 'Child components' }];
    const item = new vscode.CompletionItem('x');
    item.insertText = new vscode.SnippetString('"body": {\\n  $0\\n}');
    return [item];
  }
}
`;

  it('DIFFERENTIAL — the census reads 0 inside the literal and the scan reads two producers', () => {
    const root = plant({ 'packages/vscode-extension/src/providers/CompletionProvider.ts': SNIPPET_PRODUCER });

    const censusRun = census(root);
    // Lit control — the census walked the tree.
    expect(censusRun.filesScanned).toBeGreaterThan(0);
    expect(
      censusRun.hits.filter((hit: { file: string }) => hit.file.includes('CompletionProvider')),
    ).toEqual([]);

    const run = scan(root);
    const producers = producersOf(run.hits, run.readers).filter((p: { file: string }) =>
      p.file.includes('CompletionProvider'),
    );
    expect(producers.map((p: { source: string }) => p.source).sort()).toEqual([
      'key-name-datum',
      'literal-key-syntax',
    ]);
    for (const producer of producers) {
      expect(producer.carrier).toBe('string');
      expect(producer.channel).toBe('snippet');
      // ⛔ A string-carried hit gets NO family disposition: the carrier is
      // whatever node the author accepts it onto, which this tree cannot see.
      expect(producer.disposition).toBe('carrier-undetermined');
    }
  });

  it('a spelling with NO emission verb in scope is teaching, ⛔ not a producer', () => {
    // The same bytes inside a hover card. C1 asks whether the spelling LEAVES
    // this tree into somebody's metadata; showing it in documentation does not.
    const root = plant({
      'packages/vscode-extension/src/providers/HoverProvider.ts': `
export class HoverProvider {
  provide() {
    return new vscode.MarkdownString('Example:\\n"body": [ ... ]');
  }
}
`,
    });
    const run = scan(root);
    expect(producersOf(run.hits, run.readers)).toEqual([]);
    // Lit control — it is SEEN, and reported; it is only held out of the table.
    const unchannelled = unchannelledOf(run.hits, run.readers);
    expect(unchannelled.map((h: { file: string }) => h.file.includes('HoverProvider'))).toContain(true);
  });
});

describe('C1 — emission, and the three things that are ⛔ not it', () => {
  it('a DECLARED value is not emitted data, whatever the key is spelled', () => {
    expect(valueKindAt('body: [1]', 5)).toBe('array');
    expect(valueKindAt('body: { a: 1 }', 5)).toBe('object');
    expect(valueKindAt("body: 'x'", 5)).toBe('string');
    expect(valueKindAt('body: z.union([])', 5)).toBe('expression');
    expect(valueKindAt('body: aliasKeyRefusal(x)', 5)).toBe('expression');
    expect(valueKindAt('body: _body,', 5)).toBe('expression');
    expect([...DATA_VALUE_KINDS].sort()).toEqual(['array', 'object', 'string', 'template']);
  });

  it('a zod tombstone is NOT a producer, while real data beside it IS', () => {
    const root = plant({
      'packages/types/src/zod/layout.zod.ts': `
export const BoxSchema = BaseSchema.extend({
  type: z.literal('box'),
  body: aliasKeyRefusal('body', 'children', 'box reads children'),
});
`,
      'packages/widget/src/w.tsx': `
ComponentRegistry.register('w', W, { defaultProps: { type: 'w', body: [{ type: 'text' }] } });
`,
    });
    const run = scan(root);
    const producers = producersOf(run.hits, run.readers);
    // Lit control in the SAME run — the emitting file IS scored, so the zero on
    // the tombstone is about the criterion and not about a blind walk.
    expect(producers.map((p: { file: string }) => p.file.split('\\').join('/'))).toEqual([
      'packages/widget/src/w.tsx',
    ]);
  });

  it('a registration `inputs` entry DECLARES the key and produces nothing', () => {
    const root = plant({
      'packages/components/src/renderers/overlay/tooltip.tsx': `
ComponentRegistry.register('tooltip', T, {
  inputs: [{ name: 'body', type: 'slot' }],
  defaultProps: { type: 'tooltip', body: [{ type: 'text' }] },
});
`,
    });
    const run = scan(root);
    const producers = producersOf(run.hits, run.readers);
    // The `inputs` datum is held out; the `defaultProps` data beside it — the
    // lit control — is not, so this is the criterion discriminating rather than
    // the file being skipped.
    expect(producers).toHaveLength(1);
    expect(producers[0].channel).toBe('default-props');
    expect(producers[0].carrier).toBe('node');
    expect(DECLARATION_SEGMENTS.some((re: RegExp) => re.test('inputs'))).toBe(true);
    // ⛔ `properties` is deliberately NOT a declaration segment: the completion
    // provider holds its offerings under exactly that name and then writes them.
    expect(DECLARATION_SEGMENTS.some((re: RegExp) => re.test('properties'))).toBe(false);
  });

  it('a channel is recognised by a KEY PATH or an EMISSION VERB, never by a file name', () => {
    const ids = EMISSION_CHANNELS.map((c: { id: string }) => c.id);
    expect(ids).toEqual(['default-props', 'scaffold', 'snippet']);
    for (const channel of EMISSION_CHANNELS as Array<{ kind: string }>) {
      expect(['key-path', 'emission-verb']).toContain(channel.kind);
    }
  });

  it('the `scaffold` channel fires — measured on a PLANT, because the tree has none today', () => {
    // objectui#7181's six producers and objectui#9847's seventh have all
    // migrated, so this channel currently matches ZERO live sites. A rule with
    // no live instance is a rule nobody has run: it is exercised here instead.
    const root = plant({
      'packages/cli/src/commands/init.ts': `
const templates = {
  simple: { type: 'div', body: [{ type: 'text', content: 'hi' }] },
};
export function init() { writeFileSync('app.json', JSON.stringify(templates.simple)); }
`,
    });
    const producers = (() => {
      const run = scan(root);
      return producersOf(run.hits, run.readers);
    })();
    expect(producers).toHaveLength(1);
    expect(producers[0].channel).toBe('scaffold');
    expect(producers[0].carrier).toBe('node');
    expect(producers[0].nodeType).toBe('div');
    // ⛔ And the verb is real: the same bytes with the write removed produce
    // nothing, so `scaffold` is not matching on the word `templates`.
    const inert = plant({ 'packages/cli/src/commands/init.ts': `
const templates = { simple: { type: 'div', body: [{ type: 'text', content: 'hi' }] } };
export function describeOnly() { return JSON.stringify(templates.simple); }
` });
    const inertRun = scan(inert);
    expect(producersOf(inertRun.hits, inertRun.readers)).toEqual([]);
  });
});

describe('C2 — applied, ⛔ not merely derived', () => {
  it('an HTTP payload `body` fails C2, and the SAME bytes with a node carrier pass', () => {
    const root = plant({
      'packages/data/src/client.ts': `
export async function send() {
  return fetch(url, { method: 'POST', body: { name: 'x' } });
}
`,
      'packages/widget/src/w.tsx': `
ComponentRegistry.register('w', W, { defaultProps: { type: 'w', body: [{ type: 'text' }] } });
`,
    });
    const run = scan(root);
    const failed = run.hits.filter(
      (hit: { file: string }) => hit.file.split('\\').join('/') === 'packages/data/src/client.ts',
    );
    expect(failed).toHaveLength(1);
    expect(failed[0].carrier).toBe('unknown');
    expect(passesC2(failed[0], run.readers)).toBe(false);
    // Lit control — the node-carried twin in the same run passes.
    const node = run.hits.find((hit: { carrier: string }) => hit.carrier === 'node');
    expect(node).toBeDefined();
    expect(passesC2(node, run.readers)).toBe(true);
  });

  it('the reader set is DERIVED, and prose ABOUT a read is ⛔ not a read', () => {
    const root = plant({
      'packages/types/src/zod/data-display.zod.ts': `
export const ListSchema = z.object({}).describe(
  'the renderer draws each entry as item.content || renderChildren(item.body), a read filed under ListItem',
);
`,
    });
    const readers = deriveReaders(root);
    // The planted reader file is the lit control: the derivation is working, so
    // the zero on the docstring is about the literal mask and not about a dead
    // instrument.
    expect(readers.reads.length).toBeGreaterThan(0);
    expect(readers.reads.filter((r: { file: string }) => r.file.includes('data-display'))).toEqual([]);
  });

  it('a corpus with NO reader is REFUSED, not reported as a clean zero', () => {
    const root = mkdtempSync(join(tmpdir(), 'body-dialect-producer-noreader-'));
    roots.push(root);
    const full = join(root, 'packages/widget/src/w.tsx');
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, "const x = { type: 'w', body: [] };\n");
    const run = scan(root);
    expect(run.readers.reads).toEqual([]);
    const verdict = finalVerdict({ filesScanned: run.filesScanned, readers: run.readers });
    expect(verdict.exit).toBe(EXIT_UNREADABLE);
    expect(verdict.refusal?.join(' ')).toContain('Zero readers derived');

    // Lit control, and the point of the whole card: a real ZERO over a real
    // corpus with a real reader is a LEGITIMATE reading and is NOT refused —
    // it is the day objectui#6771 step 4 becomes landable.
    const clean = scan(plant({}));
    expect(producersOf(clean.hits, clean.readers)).toEqual([]);
    expect(finalVerdict({ filesScanned: clean.filesScanned, readers: clean.readers }).exit).toBe(0);
  });
});

describe('⚠️ C3 — the scan REPORTS the unruled family question and ⛔ does not answer it', () => {
  it('an item carrier is filed `unruled` and is NEVER folded into the ruled total', () => {
    expect(dispositionOf('node')).toBe('ruled:6771');
    expect(dispositionOf('item')).toBe('unruled:item-carrier');
    expect(dispositionOf('string')).toBe('carrier-undetermined');

    const root = plant({
      'packages/widget/src/tabs.tsx': `
ComponentRegistry.register('tabs', T, {
  defaultProps: {
    items: [{ label: 'a', value: 'a', body: [{ type: 'text' }] }],
    body: [{ type: 'text' }],
  },
});
`,
    });
    const run = scan(root);
    const producers = producersOf(run.hits, run.readers);
    const byDisposition = producers.map((p: { disposition: string }) => p.disposition).sort();
    // Both carriers present in ONE run, so the split is a discrimination and
    // not an artifact of a corpus that only held one kind.
    // ⭐ A `defaultProps.body` is NODE-carried even with no sibling `type` —
    // the node is the registration, and its `type` is the registered key. So
    // one run yields BOTH dispositions, which is what makes the split a
    // discrimination rather than an artifact of a one-shaped corpus.
    expect(byDisposition).toEqual(['ruled:6771', 'unruled:item-carrier']);
    const ruled = producers.find((p: { disposition: string }) => p.disposition === 'ruled:6771');
    expect(ruled.nodeType).toBe('tabs');
  });

  it('the item-array key set is DERIVED from the reader, not named here', () => {
    const readers = deriveReaders(plant({}));
    expect(readers.itemArrayKeys).toEqual(['items']);
    expect(readers.receivers).toContain('item');
    expect(readers.receivers).toContain('schema');
  });
});

describe('the criterion TRAVELS with the reading', () => {
  it('every declaration is emitted, machine-readable and unique', () => {
    for (const list of [CRITERION, NOT_A_PRODUCER, KNOWN_LIMITS]) {
      const ids = (list as Array<{ id: string; what: string }>).map((l) => l.id);
      expect(ids.length).toBeGreaterThan(0);
      expect(new Set(ids).size).toBe(ids.length);
      for (const entry of list as Array<{ what: string }>) expect(entry.what.length).toBeGreaterThan(0);
    }
    expect(CRITERION.map((c: { id: string }) => c.id)).toEqual([
      'C1-emission',
      'C2-resolution',
      'C3-carrier',
    ]);
  });

  it('CLI — the payload always carries the criterion, and a refusal reaches the exit code', () => {
    const script = join(REPO_ROOT, 'scripts', 'body-dialect-producer-scan.mjs');
    const run = (args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

    const ok = run(['--root', plant({ 'packages/w/src/w.tsx': "const x = { type: 'w', body: [] };\n" }), '--json']);
    expect(ok.status).toBe(0);
    const payload = JSON.parse(ok.stdout) as {
      criterion: Array<{ id: string }>;
      notAProducer: Array<{ id: string }>;
      knownLimits: Array<{ id: string }>;
      readers: { reads: unknown[] };
    };
    // ⭐ There is no spelling of this payload that reports a table without
    // reporting what made it a table: no flag suppresses any of the three.
    expect(payload.criterion.map((c) => c.id)).toContain('C2-resolution');
    expect(payload.notAProducer.map((c) => c.id)).toContain('declaration');
    expect(payload.knownLimits.map((c) => c.id)).toContain('unruled-item-carrier');
    expect(payload.readers.reads.length).toBeGreaterThan(0);

    const blind = run(['--root', join(REPO_ROOT, 'no-such-directory-9871'), '--json']);
    expect(blind.status).toBe(EXIT_UNREADABLE);
    expect(blind.stdout).toBe('');
    expect(blind.stderr).toContain('Zero files scanned');
  });

  it('is wired into the root package.json, like every other instrument here', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    expect(pkg.scripts['census:body-dialect-producers']).toBe(
      'node scripts/body-dialect-producer-scan.mjs',
    );
  });
});

describe('⭐ the cheap pre-filter is a SUPERSET, so skipping cost never skips a hit', () => {
  /**
   * ⚠️ A pre-filter that is not a superset is a SILENT NARROWING — a scanner
   * that quietly stops reading files is the defect this whole card exists to
   * end. So the claim is pinned per hit SHAPE rather than asserted once, and
   * the whole-tree hit-set equality is on objectui#9871's PR.
   */
  it('fires for every shape the expensive path can find', () => {
    for (const [shape, source] of [
      ['code-key, bare', "const x = { type: 'w', body: [] };"],
      ['code-key, quoted (JSON)', '{ "type": "w", "body": [] }'],
      ['code-key, spaced', 'const x = { body : [] };'],
      ['literal-key-syntax', `item.insertText = new vscode.SnippetString('"body": {}');`],
      ['key-name-datum', "const common = [{ name: 'body', desc: 'Child components' }];"],
      ['key-name-datum, double-quoted', 'const common = [{ name: "body" }];'],
    ] as const) {
      expect(CANDIDATE_FILE.test(source), `pre-filter drops ${shape}`).toBe(true);
    }
  });

  it('⚠️ BOTH alternatives are load-bearing — the datum has a COMMA, not a colon', () => {
    // The first alternative alone would drop the sharpest producer in the tree:
    // `{ name: 'body', desc: … }` has no colon after the quoted key.
    const datum = "const common = [{ name: 'body', desc: 'Child components' }];";
    expect(/body\s*["']?\s*:/.test(datum), 'the colon alternative alone matches').toBe(false);
    expect(/["']body["']/.test(datum)).toBe(true);
    expect(CANDIDATE_FILE.test(datum)).toBe(true);
  });

  it('does NOT fire on the `body` population that carries no key', () => {
    for (const source of [
      'const n = schema.bodyExtra;',
      '// the response body is parsed downstream',
      'function nobody() { return 1; }',
      'const b = res.body;',
    ]) {
      expect(CANDIDATE_FILE.test(source), `pre-filter fires on ${source}`).toBe(false);
    }
  });

  it('⭐ OVER-accepts by design — a superset may say yes too often, NEVER too rarely', () => {
    // `const variant = 'body'` is a quoted `body` that is not a key, and the
    // pre-filter admits it. That is CORRECT: the cheap side may only ever be
    // wider than the expensive side. The expensive path then finds nothing
    // there, which costs a little time and ⛔ never a hit.
    expect(CANDIDATE_FILE.test("const variant = 'body';")).toBe(true);
    const root = plant({ 'packages/noise/src/t.ts': "export const variant = 'body';\n" });
    const run = scan(root);
    expect(run.hits.filter((h: { file: string }) => h.file.includes('noise'))).toEqual([]);
    // Lit control — the same run DOES resolve the planted reader file, so the
    // zero above is about this file and not about a walk that read nothing.
    expect(run.filesScanned).toBeGreaterThan(0);
    expect(run.readers.reads.length).toBeGreaterThan(0);
  });

  it('DIFFERENTIAL — the same planted corpus yields the same hits with the filter in place', () => {
    // Lit control on the cheap side: the corpus DOES produce a hit, so the
    // equality below is between two non-empty readings and not two blanks.
    const root = plant({
      'packages/widget/src/w.tsx': `
ComponentRegistry.register('w', W, { defaultProps: { type: 'w', body: [{ type: 'text' }] } });
`,
      'packages/noise/src/http.ts': `
export const send = () => fetch(url, { method: 'POST' });
// the response body is parsed downstream, and schema.bodyExtra is a different key
`,
    });
    const run = scan(root);
    expect(run.hits.length).toBeGreaterThan(0);
    // Every hit came from a file the pre-filter admits — the property the
    // superset argument rests on, checked against the real hits.
    for (const hit of run.hits) {
      const text = readFileSync(join(root, hit.file), 'utf8');
      expect(CANDIDATE_FILE.test(text), `${hit.file} produced a hit the pre-filter would drop`).toBe(true);
    }
  });
});

describe('the emission verb is scoped to the enclosing FUNCTION, not to the file', () => {
  it('a verb in a different function does not vouch for this one', () => {
    const text = `
function writes() { editor.insertText('x'); }
function declares() { return { name: 'body' }; }
`;
    const { comment, literal } = scanSource(text);
    const { frames } = walkFrames(blank(text, comment), literal);
    const offset = text.indexOf("name: 'body'");
    const scope = enclosingScope(frames, offset);
    expect(scope.length).toBeGreaterThan(0);
    const scopeText = text.slice(scope[scope.length - 1].start, scope[scope.length - 1].end);
    expect(scopeText).toContain("name: 'body'");
    // The lit control is the other half of the same file, which DOES hold a verb.
    expect(scopeText).not.toContain('insertText');
    expect(text).toContain('insertText');
  });
});

describe('the LIVE tree, read through the criterion', () => {
  it('the producer table is DERIVED and reaches both shapes the census cannot', () => {
    const run = scan(REPO_ROOT);
    // Two lit controls: the walk resolved files, and C2 derived readers — so a
    // zero below would be a reading and not a blind instrument.
    expect(run.filesScanned).toBeGreaterThan(0);
    expect(run.readers.reads.length).toBeGreaterThan(0);

    const producers = producersOf(run.hits, run.readers);
    const files = new Set(producers.map((p: { file: string }) => p.file.split('\\').join('/')));

    // ⭐ Asserted as SHAPES, not as a count and not as a list of paths: a
    // producer arriving in a file nobody named appears in `producers` without
    // anyone extending anything, which is the whole point of this card.
    expect(producers.filter((p: { carrier: string }) => p.carrier === 'item').length).toBeGreaterThan(0);
    expect(files.size).toBeGreaterThan(0);

    // ⚠️ B2 INVERTED BY objectui#6771, and this is the SECOND copy of the claim
    // — the census block carries the first. ⭐ Neither file was in the merge's
    // text intersection with this branch, which is the lesson: a one-file
    // overlap said the text merged, and the two scans still met HERE.
    // objectui#9871 asserted a string-carried producer EXISTED; its only
    // subjects were the three `CompletionProvider` snippets, which step 5
    // migrated. ⛔ Not deleted, per this file's own instruction: re-pointed.
    //
    // ⭐ The zero carries the same two lit controls as the census copy, because
    // `source !== 'code-key'` is a conjunction and one control would leave half
    // of it untested: B2 still reads inside literals AT ALL, and a
    // literal-carried hit still PASSES C2. Without both, `toBe(0)` would hold
    // over a scan gone blind to literals — the failure B2 exists to end.
    expect(
      run.hits.filter((h: { source: string }) => h.source !== 'code-key').length,
      'lit control — no literal-carried `body` resolved anywhere, so B2 has gone blind',
    ).toBeGreaterThan(0);
    expect(
      unchannelledOf(run.hits, run.readers).filter(
        (h: { source: string }) => h.source !== 'code-key',
      ).length,
      'lit control — no literal-carried hit passes C2, so the zero below would measure C2 ' +
        'rather than the emission channel it claims to measure',
    ).toBeGreaterThan(0);
    expect(
      producers.filter((p: { source: string }) => p.source !== 'code-key').length,
      'a string-carried producer is BACK — objectui#6771 step 5 migrated the last of them. ' +
        'A new one means a tool started writing the retired spelling into an author document ' +
        'again; ⛔ do not relax this to a range.',
    ).toBe(0);

    // ⭐ And the claim that outlives every one of them — ⚠️ CORRECTED, because
    // objectui#9871 wrote it as "while the table is non-empty, objectui#6771
    // step 4 is not landable" and that blanket does not survive measurement.
    // This file files every surviving producer `unruled:item-carrier` and says
    // in as many words that whether an item-carried `body` belongs to
    // objectui#6771 is UNRULED — so using the same rows to block that card's
    // step 4 reads the question back as an answer.
    //
    // Probed rather than reasoned, both legs, against the built parser: the
    // tier refuses `body` inside `Object.entries(node)` on a node whose `type`
    // resolves to a registration, so a `card` NODE carrying `body` draws
    // `unknown-prop: <card> has no prop "body" — the child-list key is
    // "children"`, and a `tabs` ITEM carrying the same key draws ZERO
    // diagnostics. ⇒ step 4 refuses nothing the platform still ships.
    // An empty table is objectui#9590's finish line, ⛔ not step 4's gate.
    // ⛔ When this reds because the table emptied, that is still the HANDOFF —
    // say so here in those terms rather than deleting the assertion.
    expect(
      producers.length,
      'the producer table is EMPTY — under this criterion nothing ships the dialect. That is ' +
        'objectui#9590\'s finish line, ⛔ NOT objectui#6771 step 4\'s gate: step 4 landed with ' +
        'this table non-empty and item-carried. Re-point this block, do not delete it.',
    ).toBeGreaterThan(0);
    // ⏱ Explicit — one tree-wide scan over 5,136 files, measured 4.0s here; the
    // CI shard is at least 1.9x slower (objectui#9871's timeout reading), and
    // the default 15s leaves too little room on a loaded shard. Same 60s and the
    // same reason as the census block. ⛔ Not a global `testTimeout` bump.
  }, 60_000);
});
