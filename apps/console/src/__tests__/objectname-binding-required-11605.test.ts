/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11605 — a registration whose node accepts a `dataSource` binding
 * does not declare `required: true` on a key that binding supplies, unless its
 * spec row requires it. The family's closing card, after objectui#11569
 * (`record:line_items` and `childObject`).
 *
 * The page compile (`compile()` in `@object-ui/sdui-parser`, whose `ok` is the
 * save gate) reads each registration's `inputs`, and its only requiredness
 * check is `input.required && !(input.name in node)`. So a registration that
 * declared `{ name: 'objectName', required: true }` refused a node whose
 * `dataSource.object` names the object, although the gate lands that object
 * on `objectName` before the block reads the node, and the spec row (or, where
 * the block has none, the binding doc) says such a node needs no `objectName`.
 * The manifest has no "this key or a binding that supplies it" form, and the
 * triage ruling on this card forbids adding one, so the registrations stop
 * requiring the key. A node with neither is answered at runtime by the gate's
 * "no object named" hint, pinned beside this file in
 * `objectname-neither-hint-11605.test.tsx`.
 *
 * Judged against the manifest the console SHIPS: `emitSduiManifest` over the
 * registry `dev/manifest-registry.ts` loads, read back from the written
 * `sdui.manifest.json`, the file a host registers as the page-save gate's
 * manifest (objectui#11403).
 *
 * Rows:
 * 1. The enumeration pin. For every entry whose inputs carry the injected
 *    `dataSource` binding input, every `required: true` input is one of:
 *    required by the tag's `ComponentPropsMap` row; not a key the binding
 *    supplies on that tag; or in {@link LEDGER} with a reason. One test per
 *    entry, so a newly registered contradiction is red BY NAME.
 * 2. The ledger has no stale row: each names a bound entry that still requires
 *    that input, which the binding still supplies and the row does not require.
 * 3. The binding doc's table names every bound entry, so what the binding
 *    supplies is read off the documented contract for each of them, and the
 *    object key this file assumes is one the entry declares.
 * 4. Per member that moved: the published `objectName` is not required and its
 *    description names `dataSource.object`; a bound node compiles `ok` with no
 *    diagnostic and the binding is recorded; a node with neither draws no
 *    compile diagnostic about `objectName`.
 * 5. Controls: the gate still judges requiredness on these tags (a moving
 *    member's other required input is still refused), and `record:related_list`,
 *    whose spec row requires `objectName`, still refuses a node without it.
 */

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { ComponentPropsMap } from '@objectstack/spec/ui';
import { compile, type Manifest, type ManifestInput } from '@object-ui/sdui-parser';
// Module scope, not a hook: the whole registration graph loads at import time.
import '../../dev/manifest-registry';
import { emitSduiManifest } from '../../scripts/emit-sdui-manifest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..', '..');

const scratchDir = mkdtempSync(join(tmpdir(), 'sdui-manifest-11605-'));
afterAll(() => {
  rmSync(scratchDir, { recursive: true, force: true });
});

/** The shipped `sdui.manifest.json`, read back as the host reads it. */
const shipped = JSON.parse(readFileSync(emitSduiManifest(scratchDir), 'utf8')) as Manifest;

const inputsOf = (tag: string): ManifestInput[] => shipped.components[tag]?.inputs ?? [];

/**
 * The entries whose node accepts a `dataSource` binding: `Registry.register`
 * injects the binding input (`binding: 'object'`) for exactly the renderers
 * that wrap `ElementDataSourceGate`, so the manifest itself says which they are.
 */
const BOUND = Object.keys(shipped.components)
  .filter((tag) => inputsOf(tag).some((input) => input.name === 'dataSource' && input.binding === 'object'))
  .sort();

/* ── What the binding supplies, read off the binding doc ───────────────────── */

const BINDING_DOC = 'content/docs/guide/data-source.md';

const TABLE_HEADING = '### Which blocks consume it, and which keys each one honours';

/**
 * The doc's "which keys each one honours" table, one row per block:
 * `| \`tag\` | object | view | filter | sort | limit |`. Read from that heading
 * to the end of the table only, so another table on the page cannot overwrite
 * a row.
 */
function bindingDocRows(): Map<string, { object: string; view: string }> {
  const text = readFileSync(join(REPO_ROOT, BINDING_DOC), 'utf8');
  const start = text.indexOf(TABLE_HEADING);
  expect(start, `${BINDING_DOC} has no "${TABLE_HEADING}" section`).toBeGreaterThan(-1);
  const section = text.slice(start).split('\n');
  const tableStart = section.findIndex((line) => line.startsWith('|'));
  const table: string[] = [];
  for (const line of section.slice(tableStart)) {
    if (!line.startsWith('|')) break;
    table.push(line);
  }
  const rows = new Map<string, { object: string; view: string }>();
  for (const line of table) {
    const match = /^\| `([^`]+)` \| ([^|]+) \| ([^|]+) \|/.exec(line);
    if (match) rows.set(match[1], { object: match[2].trim(), view: match[3].trim() });
  }
  return rows;
}

const DOC_ROWS = bindingDocRows();

/**
 * The key the binding's `object` lands on. The doc: "it lands on the block's
 * own object key, which is `objectName` everywhere except `record:line_items`"
 * (its row spells that key in the `object` column), and "The two `element:*`
 * rows keep their configuration in the node's `properties` bag ...
 * `dataSource.object` wins over `properties.object`".
 */
function objectKeyOf(tag: string): string {
  const named = /\(`([^`]+)`\)/.exec(DOC_ROWS.get(tag)?.object ?? '');
  if (named) return named[1];
  if (tag.startsWith('element:')) return 'object';
  return 'objectName';
}

/**
 * The keys the binding supplies on `tag`: its object key always, and
 * `columns` where a named view's field list fills them (the row's `view`
 * column is a full ✅, or lists `columns`). `filter`, `sort` and the row cap
 * are supplied too, but no registration requires one, so they are not read.
 */
function bindingSupplies(tag: string): Set<string> {
  const supplied = new Set([objectKeyOf(tag)]);
  const view = DOC_ROWS.get(tag)?.view ?? '';
  if (view === '✅' || view.includes('columns')) supplied.add('columns');
  return supplied;
}

/* ── What the spec row requires ────────────────────────────────────────────── */

type ZodMember = { isOptional: () => boolean };
const specRowShape = (tag: string): Record<string, ZodMember> | undefined =>
  (ComponentPropsMap as unknown as Record<string, { shape?: Record<string, ZodMember> } | undefined>)[tag]?.shape;

const specRowRequires = (tag: string, key: string): boolean => {
  const member = specRowShape(tag)?.[key];
  return member !== undefined && !member.isOptional();
};

/* ── The ledger ────────────────────────────────────────────────────────────── */

/**
 * Required inputs that the binding supplies and the spec row does not require,
 * each with the reason it stays required. Entries are debt, not acceptance:
 * row 2 fails on one that no longer describes the manifest.
 *
 * Empty. Its last row, `record:related_list.columns`, was moved rather than
 * kept (objectui#11613): the registration stopped requiring `columns`, as the
 * spec row does not, so row 1 now covers that member like the others. A
 * columns-less node draws the named view's columns or, with no view, columns
 * derived from the related object; the console's
 * `related-list-columns-optional-11613.test.ts` pins the compile.
 */
const LEDGER: Readonly<Record<string, Readonly<Record<string, string>>>> = {};

/* ── 1–3: the enumeration pin ──────────────────────────────────────────────── */

describe('objectui#11605 — a bound registration requires no input its binding supplies, unless its spec row does', () => {
  it('the bound population is read from the shipped manifest and is not vacuous', () => {
    // A control on the extraction, not a census: the members this card moves
    // and the precedent's tag are all bound entries.
    expect(BOUND).toEqual(
      expect.arrayContaining([
        'object-grid',
        'list-view',
        'object-form',
        'embeddable-form',
        'object-master-detail-form',
        'object-kanban',
        'object-metric',
        'object-chart',
        'object-pivot',
        'record:line_items',
        'record:related_list',
      ]),
    );
    // And the filter is a filter: `object-tree` is a shipped entry that wraps
    // no gate, so it is not bound.
    expect(shipped.components['object-tree']).toBeDefined();
    expect(BOUND).not.toContain('object-tree');
  });

  for (const tag of BOUND) {
    it(`${tag}: every required input is required by its spec row, not supplied by the binding, or ledgered`, () => {
      const supplied = bindingSupplies(tag);
      const contradictions = inputsOf(tag)
        .filter((input) => input.required === true)
        .map((input) => input.name)
        .filter((name) => !specRowRequires(tag, name))
        .filter((name) => supplied.has(name))
        .filter((name) => LEDGER[tag]?.[name] === undefined);
      expect(
        contradictions,
        `<${tag}> declares ${contradictions.map((n) => `"${n}"`).join(', ')} required, but its ` +
          '`dataSource` binding supplies it and its spec row does not require it, so the page compile ' +
          'refuses a node bound by `dataSource.object`. Drop `required: true` and describe the binding ' +
          '(objectui#11605), or ledger it here with the reason it stays.',
      ).toEqual([]);
    });
  }

  it('the ledger has no stale row', () => {
    for (const [tag, rows] of Object.entries(LEDGER)) {
      expect(BOUND, `ledgered tag ${tag} is not a bound entry of the shipped manifest`).toContain(tag);
      for (const [name, reason] of Object.entries(rows)) {
        const input = inputsOf(tag).find((candidate) => candidate.name === name);
        expect(input?.required, `${tag}.${name} is ledgered but no longer required: delete the row`).toBe(true);
        expect(bindingSupplies(tag).has(name), `${tag}.${name} is ledgered but the binding does not supply it`).toBe(true);
        expect(specRowRequires(tag, name), `${tag}.${name} is ledgered but its spec row requires it`).toBe(false);
        expect(reason.length, `${tag}.${name} needs a written reason`).toBeGreaterThan(20);
      }
    }
  });

  it('the binding doc names every bound entry, and each object key is one the entry declares', () => {
    const undocumented = BOUND.filter((tag) => !DOC_ROWS.has(tag));
    expect(undocumented, `${BINDING_DOC} must say what the binding supplies on each bound block`).toEqual([]);
    for (const tag of BOUND) {
      const key = objectKeyOf(tag);
      expect(
        inputsOf(tag).map((input) => input.name),
        `<${tag}>: the binding's object lands on "${key}", which the entry does not declare`,
      ).toContain(key);
    }
    // Controls on the doc reading: the exception it names, and a full-view row.
    expect(objectKeyOf('record:line_items')).toBe('childObject');
    expect(bindingSupplies('object-grid').has('columns')).toBe(true);
    expect(bindingSupplies('object-kanban').has('columns')).toBe(false);
  });
});

/* ── 4–5: per member, the bound node and the neither node ──────────────────── */

/**
 * Each member this card moved, with the other required props it still needs
 * (as JSX attributes), so the bound node is a complete one.
 */
const MEMBERS: ReadonlyArray<{ tag: string; rest: string }> = [
  { tag: 'object-grid', rest: '' },
  { tag: 'list-view', rest: '' },
  { tag: 'object-form', rest: '' },
  { tag: 'embeddable-form', rest: 'formId="contact_us"' },
  { tag: 'object-master-detail-form', rest: 'details={[{ childObject: "order_line" }]}' },
  { tag: 'object-kanban', rest: '' },
  { tag: 'object-metric', rest: '' },
  { tag: 'object-chart', rest: '' },
  { tag: 'object-pivot', rest: 'rowField="region" columnField="stage" valueField="amount"' },
];

const nodeOf = (tag: string, attrs: string) => `<${tag} ${attrs} />`;

const diagnosticsOf = (source: string) =>
  compile(source, shipped).diagnostics.map((d) => [d.severity, d.code, d.message]);

describe('objectui#11605 — each member compiles a bound node, and leaves the neither node to the runtime', () => {
  it.each(MEMBERS)('$tag — the published objectName is not required and names the binding', ({ tag }) => {
    const objectName = inputsOf(tag).find((input) => input.name === 'objectName');
    expect(objectName, `${tag} publishes no objectName input`).toBeDefined();
    expect(objectName?.required).not.toBe(true);
    expect(objectName?.description ?? '').toContain('`dataSource.object`');
  });

  it.each(MEMBERS)('$tag — a dataSource-bound node with no objectName compiles ok', ({ tag, rest }) => {
    const result = compile(nodeOf(tag, `dataSource={{ object: "account" }} ${rest}`), shipped);
    expect(result.diagnostics.map((d) => [d.severity, d.code, d.message])).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.bindings).toEqual([
      { tag, input: 'dataSource', kind: 'object', value: { object: 'account' } },
    ]);
  });

  it.each(MEMBERS)('$tag — a node with neither draws no compile diagnostic about objectName', ({ tag, rest }) => {
    const messages = diagnosticsOf(nodeOf(tag, rest)).map(([, , message]) => message);
    expect(messages.filter((message) => String(message).includes('"objectName"'))).toEqual([]);
  });

  it('control: the gate still judges requiredness on a moved tag', () => {
    // The bound node above names `formId`; without it the same tag is refused,
    // so the empty list there is a reading of this entry. The node names
    // `objectName`, so this row reads the same before and after the fix: it is
    // a control on the gate, not a second pin.
    const source = nodeOf('embeddable-form', 'objectName="lead"');
    expect(diagnosticsOf(source)).toEqual([
      ['error', 'missing-required-prop', '<embeddable-form> is missing required prop "formId"'],
    ]);
    expect(compile(source, shipped).ok).toBe(false);
  });

  it('control: record:related_list keeps objectName required, because its spec row requires it', () => {
    expect(specRowRequires('record:related_list', 'objectName')).toBe(true);
    const source = '<record:related_list relationshipField="account" columns={["name"]} />';
    expect(diagnosticsOf(source)).toEqual([
      ['error', 'missing-required-prop', '<record:related_list> is missing required prop "objectName"'],
    ]);
  });
});
