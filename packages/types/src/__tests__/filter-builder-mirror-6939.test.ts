/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * objectui#6939, the `filter-builder` group — the VALIDATOR half. The render
 * half is
 * `examples/schema-catalog/test/filter-builder-mirror-6939.test.tsx`.
 *
 * ## The defect
 *
 * Three independent mis-declarations in one member, each a key-name or
 * vocabulary MOVE rather than a missing optional key:
 *
 *   1. `FilterFieldSchema` required `name`. Every read site matches an entry by
 *      `value` — `fields.find((f) => f.value === …)` in `getOperatorsForField`,
 *      `changeField`, `getInputType` and `renderValueInput`, `fields[0]?.value`
 *      in `addCondition`, and `<SelectItem value={field.value}>` in the field
 *      dropdown. `name` had zero.
 *   2. Its `type` enum was `string | number | date | boolean | select`.
 *      `string` is a phantom; `text`, `datetime` and `time` — three of the six
 *      `FilterValueFamily` members the component actually folds a column into —
 *      were all refused.
 *   3. `FilterGroupSchema` was `{ operator, conditions }`. The gate is
 *      `isValidGroup` (`custom/filter-builder.tsx:1060`), which reads
 *      `conditions` and `logic` and nothing else.
 *
 * All five `components-complex-filter-builder/*` catalog entries author
 * `{ value, label, type }` fields and a `{ id, logic, conditions }` group — the
 * registration's own `inputs`/`defaultProps` spelling — so the mirror refused
 * every one of them while the renderer drew them.
 *
 * ## Ruling
 *
 * Maintainer, 2026-09-02, via the director seat (summon #8), verbatim 「同意」,
 * recorded as objectui#6939 comment 5510084784. Its `filter-builder` row:
 * *field key is `value`; type vocabulary `text` / `number` / `boolean` /
 * `date` / `datetime` / `time`; group shape `{ id, logic, conditions }`.*
 *
 * ## Two places this implementation departs from a LITERAL reading, and why
 *
 * Both are measured, both are declared here rather than made quietly, and both
 * are flagged on the PR for contract review.
 *
 *   - **`select` is retained.** The ruling's six-member list inherits the
 *     finding card's description of `select` as "extra". It is not: it has its
 *     own operator bucket (`selectLikeTypes`, `custom/filter-builder.tsx:935`,
 *     read by `operatorsForFieldType` and `isOptionDrivenValueControl`) and
 *     draws the option-driven Select instead of a text box. Dropping it would
 *     refuse a spelling this mirror accepts TODAY and the renderer draws
 *     distinctly — a fresh instance of the class this card closes.
 *   - **Group `id` is declared OPTIONAL.** `isValidGroup` never consults it and
 *     nothing reads `filterGroup.id`; deleting it from an authored group
 *     renders byte-identically (the render half measures that). Requiring it
 *     would invent a refusal the renderer does not make.
 *
 * ## objectui#7562 — the vocabulary widened to the published doc's FOURTEEN
 *
 * Ruled 2026-09-08 (director seat, decision batch #88): of the three
 * declarations of this authoring surface the published doc is the AUTHORITY,
 * so `type` widens to its fourteen members and becomes OPTIONAL (`text` when
 * absent). The ruling's precondition — every one of the fourteen has a
 * renderer branch, or it comes out of the doc instead — was measured first,
 * one condition row per member through the real `FilterBuilder`, reading both
 * the value control and the operator bucket. All fourteen passed; nothing was
 * withdrawn from the doc. `FilterFieldSchema`'s docblock carries the table.
 *
 * The assertions below therefore MOVED, not merely widened: the seven
 * `still refuses the live-but-unruled spelling …` pins became
 * `accepts …, and the renderer draws it`, and the doc-vs-mirror assertion's
 * closing line — which pinned that the mirror still required `type` — became
 * its opposite. That is the whole delta objectui#7562 lands here.
 *
 * ## objectui#8774 — the doc-WIDENING direction, which nothing here caught
 *
 * objectui#7562 made the doc the authority, but the pins in this file bound the
 * enum to a hard-coded `DOCUMENTED_FOURTEEN` constant, and the doc-reading pin
 * asserted only doc ⊇ fourteen. So of the two ways the authority can move, one
 * was guarded and one was not:
 *
 *   - doc NARROWS (a member removed) → the ⊇ pin reddens.
 *   - doc WIDENS (a fifteenth member added) → nothing reddened. And widening is
 *     the direction objectui#7562 CAME FROM: the doc published fourteen while
 *     the mirror accepted seven, and no instrument said so.
 *
 * Measured, not reasoned. The ceiling reviewer's ablation Leg E added `'email'`
 * to the DOC alone (hash-verified, restored) and every pin in this file stayed
 * green; its control, Leg D — the same member added to BOTH code faces — did
 * redden, so the file was live and the hole was directional.
 *
 * The fix is that the population is now TAKEN from the doc (`documentedTypes()`)
 * instead of copied beside it, so `the accept set is EXACTLY the published doc`
 * compares the enum against the authority rather than against a copy of it and
 * fails in both directions. A doc-seeded pin has its own failure mode — a reader
 * that silently matches nothing turns the pin vacuous in the same stroke — so
 * every reader THROWS on absence and `the doc reader has a floor` drives that,
 * with the doc's own two-member `logic` union as the positive control.
 *
 * ⛔ If this pin reddens because the DOC widened: the mirror follows, as its own
 * reviewable change. ⛔ Never narrow the doc to match the mirror — under
 * decision batch #88 a contract does not retract what it published to authors.
 *
 * ## What this change does NOT reach, stated rather than left as an absence
 *
 * Two of the four census entries — `product-search` and `with-conditions`, plus
 * the `filter-builder` nested inside `search-interface` — still refuse
 * afterwards, on a FOURTH divergence the ruling does not address: they author
 * `conditions[].operator` as `eq` / `gt` / `lt`, and `FilterOperatorSchema` is
 * the spec's canonical `equals` / `greater_than` / `less_than`.
 * `assertion the residual refusal is the operator alias and nothing else`
 * pins that mechanically — swapping only those three spellings makes both
 * entries parse — so the claim "the three ruled divergences are gone from all
 * four" is measured rather than asserted. The operator vocabulary is a genuine
 * fork (the builder's own dropdown ids are `notEquals` / `greaterThan`, which
 * this mirror ALSO refuses, while the canonical spellings it accepts render a
 * blank operator trigger) and needs its own ruling.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { FilterBuilderSchema, FilterFieldSchema, FilterGroupSchema } from '../zod/complex.zod';
import { safeValidateSchema } from '../zod/index.zod';
import type { FilterField as TsFilterField, FilterGroup as TsFilterGroup } from '../complex';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..', '..');
const CATALOG = join(REPO_ROOT, 'examples/schema-catalog/src/schemas/components-complex-filter-builder');
const READER = 'packages/components/src/custom/filter-builder.tsx';
/**
 * The published doc — a THIRD declaration of this authoring surface, and since
 * decision batch #88 (objectui#7562) the AUTHORITY for it: *"a contract does
 * not retract what it published to authors."* Both faces repaired in this file
 * follow it; they do not define it.
 */
const DOC = 'content/docs/components/complex/filter-builder.mdx';

function publishedDoc(): string {
  return readFileSync(join(REPO_ROOT, DOC), 'utf8');
}

/** The four entries `node packages/cli/dist/cli.js check` counts for this row. */
const CENSUS = ['empty-filter-builder', 'product-search', 'user-filters', 'with-conditions'] as const;

function entry(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(CATALOG, `${name}.json`), 'utf8')) as Record<string, unknown>;
}

/** The `filter-builder` node nested inside the `stack`-rooted fifth entry. */
function nestedSearchInterface(): Record<string, unknown> {
  const doc = entry('search-interface') as { children: Record<string, unknown>[] };
  const node = doc.children.find((c) => c.type === 'filter-builder');
  if (!node) throw new Error('search-interface no longer carries a filter-builder child');
  return node;
}

/** Report the issues rather than `false`, so a red run says what broke. */
function reasons(schema: unknown): string[] {
  const r = safeValidateSchema(schema);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
}

/** The three alias spellings the fixtures use, mapped to what this mirror declares. */
const CANONICAL: Record<string, string> = { eq: 'equals', gt: 'greater_than', lt: 'less_than' };

function withCanonicalOperators(doc: Record<string, unknown>): Record<string, unknown> {
  const group = doc.value as { conditions: { operator: string }[] };
  return {
    ...doc,
    value: {
      ...group,
      conditions: group.conditions.map((c) => ({ ...c, operator: CANONICAL[c.operator] ?? c.operator })),
    },
  };
}

/* ── Type-level pins (invariant equality, house form) ─────────────────────── */

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
function expectType<T extends true>(_: T = true as T): void { /* compile-time only */ }

// The TS twin moved WITH the mirror. These fail to compile if either face
// drifts back, which is the half a runtime assertion cannot cover.
expectType<Equal<TsFilterField['value'], string>>();
expectType<Equal<TsFilterField['type'],
  | 'text' | 'number' | 'currency' | 'percent' | 'rating'
  | 'date' | 'datetime' | 'time'
  | 'boolean'
  | 'select' | 'status'
  | 'lookup' | 'master_detail' | 'user'
  | undefined>>();
// `type` is OPTIONAL, not merely `… | undefined`: an entry that OMITS the key
// must be assignable, which only this annotation proves — the same distinction
// the group `id` needs three lines down (objectui#7562, item 2).
const fieldWithoutType: TsFilterField = { value: 'a', label: 'A' };
expectType<Equal<TsFilterGroup['logic'], 'and' | 'or'>>();
expectType<Equal<TsFilterGroup['id'], string | undefined>>();
// `id` is OPTIONAL, not merely typed `string | undefined`: an object that omits
// the key must be assignable, which only this annotation proves.
const groupWithoutId: TsFilterGroup = { logic: 'and', conditions: [] };
// `name` is gone from the declaration — `@ts-expect-error` is the assertion.
// @ts-expect-error `FilterField.name` was renamed to `value` (objectui#6939)
const legacyNamedField: TsFilterField = { name: 'a', label: 'A', type: 'text' };

describe('objectui#6939 — the field key is `value`', () => {
  it('accepts the spelling every read site matches on', () => {
    expect(FilterFieldSchema.safeParse({ value: 'a', label: 'A', type: 'text' }).success).toBe(true);
  });

  it('REFUSES the former `name` spelling — this half of the move is breaking', () => {
    // The accept set MOVES here, it does not merely widen: a document authored
    // against the old mirror stops validating. Named in the changeset.
    expect(FilterFieldSchema.safeParse({ name: 'a', label: 'A', type: 'text' }).success).toBe(false);
  });

  it('`name` is not silently tolerated as a passthrough hole either', () => {
    // A plain `z.object` STRIPS unknown keys, so an undeclared `name` would be
    // accepted-and-discarded rather than refused. What makes the refusal real
    // is that `value` is REQUIRED, so the old shape has no identity at all.
    const parsed = FilterFieldSchema.safeParse({ value: 'a', label: 'A', type: 'text', name: 'a' });
    expect(parsed.success).toBe(true);
    expect(parsed.success && 'name' in parsed.data).toBe(false);
  });

  it('the reader still matches on `value`', () => {
    // Text-anchored, so a rename in the component turns this red instead of
    // leaving the prose above quietly false.
    const src = readFileSync(join(REPO_ROOT, READER), 'utf8');
    expect(src).toContain('fields.find((f) => f.value === fieldValue)');
    expect(src).toContain('fields[0]?.value');
    expect(src).toContain('value: string');
  });
});

/** The ruling's six. */
const RULED = ['text', 'number', 'boolean', 'date', 'datetime', 'time'] as const;

/**
 * The seven the published doc declares that this mirror refused until
 * objectui#7562 — each with its own named bucket in
 * `custom/filter-builder.tsx` and its own value control, which is exactly why
 * the ruling let them in rather than cutting them out of the doc.
 *
 * Paired with the bucket that CARRIES each one, so "it draws" is asserted
 * against the renderer source rather than restated as prose. The buckets are
 * literal `const` arrays, so a rename or a deletion in the component turns
 * this red instead of leaving the mirror declaring a key nothing draws.
 */
const DOC_ONLY_TYPES: ReadonlyArray<readonly [string, string]> = [
  ['currency', 'const numberLikeTypes = ["number", "currency", "percent", "rating"]'],
  ['percent', 'const numberLikeTypes = ["number", "currency", "percent", "rating"]'],
  ['rating', 'const numberLikeTypes = ["number", "currency", "percent", "rating"]'],
  ['status', 'const selectLikeTypes = ["select", "status"]'],
  ['lookup', 'const lookupLikeTypes = ["lookup", "master_detail", "user"]'],
  ['master_detail', 'const lookupLikeTypes = ["lookup", "master_detail", "user"]'],
  ['user', 'const lookupLikeTypes = ["lookup", "master_detail", "user"]'],
];

/** The seven spellings above, for the places that only need the names. */
const UNRULED_LIVE_TYPES = DOC_ONLY_TYPES.map(([type]) => type);

/**
 * One `interface <name> { … }` block out of the published doc's schema fence.
 *
 * Throws rather than returning an empty string, and the same goes for every
 * reader below it. A doc-seeded pin has exactly one interesting failure mode —
 * the reader quietly matches nothing, the population comes back empty, and
 * every assertion built on it passes while checking nothing — so absence is
 * LOUD here, and the floor test drives both throws.
 */
function docInterfaceBlock(doc: string, iface: string): string {
  const open = doc.indexOf(`interface ${iface} {`);
  if (open === -1) throw new Error(`${DOC}: no \`interface ${iface} {\` block`);
  const close = doc.indexOf('\n}', open);
  if (close === -1) throw new Error(`${DOC}: \`interface ${iface}\` is never closed`);
  return doc.slice(open, close);
}

/**
 * Every quoted member of the union `<iface>.<key>` declares, in the doc's own
 * order. The union may span LINES — the doc lays `type?:` out over five rows —
 * so the slice runs to the terminating `;`, not to the end of the line. Line
 * comments are stripped first: `// Field type` sits inside that slice, and an
 * apostrophe in some future one would otherwise mint a phantom member.
 */
function docUnionMembers(doc: string, iface: string, key: string): string[] {
  const block = docInterfaceBlock(doc, iface);
  const at = block.indexOf(`\n  ${key}:`);
  if (at === -1) throw new Error(`${DOC}: \`${iface}\` no longer declares \`${key}\``);
  const end = block.indexOf(';', at);
  if (end === -1) throw new Error(`${DOC}: \`${iface}.${key}\` is unterminated`);
  const body = block.slice(at, end).replace(/\/\/[^\n]*/g, '');
  const members = [...body.matchAll(/'([^']*)'/g)].map((m) => m[1]);
  if (members.length === 0) {
    throw new Error(`${DOC}: \`${iface}.${key}\` parsed to ZERO members`);
  }
  return members;
}

/**
 * The accept set, TAKEN from the authority rather than copied from it
 * (objectui#8774).
 *
 * This used to be a hand-kept `DOCUMENTED_FOURTEEN` constant sitting beside the
 * pin. A population maintained here can only ever confirm the mirror it was
 * copied from, which is precisely the blindness objectui#7562 turned out to be:
 * the doc had moved, both code faces agreed with each other, and no instrument
 * said so. Measured before it was changed — the ceiling reviewer's ablation
 * Leg E added a fifteenth member to the DOC alone and every pin in this file
 * stayed green.
 */
function documentedTypes(): string[] {
  return docUnionMembers(publishedDoc(), 'FilterField', 'type?');
}

/** The enum this mirror actually declares, behind `.optional()`. */
function mirrorTypeMembers(): string[] {
  return (FilterFieldSchema as unknown as {
    shape: { type: { unwrap(): { options: string[] } } };
  }).shape.type.unwrap().options;
}

describe('objectui#6939 — the type vocabulary', () => {

  it.each(RULED)('accepts the ruled member `%s`', (type) => {
    expect(FilterFieldSchema.safeParse({ value: 'a', label: 'A', type }).success).toBe(true);
  });

  it('accepts `select`, which this implementation RETAINS against a literal reading', () => {
    // ⚠️ Declared departure — see the header. `selectLikeTypes` gives `select`
    // its own operator bucket and the option-driven value control, so dropping
    // it would refuse a live spelling. If contract review rules the other way,
    // this is the assertion that flips, together with the enum.
    expect(FilterFieldSchema.safeParse({ value: 'a', label: 'A', type: 'select' }).success).toBe(true);
    const src = readFileSync(join(REPO_ROOT, READER), 'utf8');
    expect(src).toContain('const selectLikeTypes = ["select", "status"]');
  });

  it('REFUSES `string` — the phantom the enum used to carry', () => {
    // Breaking half #2. `string` reached the text control only by the
    // unrecognised-word fallthrough in `valueFamilyForFieldType`, so it was
    // indistinguishable from a nonsense spelling; the render half measures that.
    expect(FilterFieldSchema.safeParse({ value: 'a', label: 'A', type: 'string' }).success).toBe(false);
  });

  it.each(DOC_ONLY_TYPES)(
    'accepts `%s`, and the renderer draws it — the bucket that carries it is `%s`',
    (type, bucket) => {
      // objectui#7562, items 1+2. This assertion is the INVERSE of the one it
      // replaced (`still refuses the live-but-unruled spelling …`): the ruling
      // made the published doc the authority, so a member the doc offers and
      // the renderer draws is a member this mirror accepts.
      //
      // The two halves are asserted together on purpose. Accepting a spelling
      // is only correct while the renderer still has a branch for it, and the
      // ruling's precondition is exactly that pairing — "⛔ never a key
      // declared that nothing draws". So the accept and the branch that earns
      // it redden as one.
      expect(FilterFieldSchema.safeParse({ value: 'a', label: 'A', type }).success).toBe(true);
      expect(readFileSync(join(REPO_ROOT, READER), 'utf8')).toContain(bucket);
    },
  );

  it('`text` earns its place by NAME, not by a distinct control', () => {
    // ⚠️ The one member whose branch a DOM measurement cannot show. `text` is
    // the unrecognised-word fallthrough TARGET, so a `text` column draws what
    // a nonsense spelling draws; measured, they are identical. What separates
    // it from the `string` phantom below is that the renderer NAMES it — line
    // 408 is where an absent `type` acquires the family called `text` — and
    // that naming is also what makes `type` safe to leave optional, which is
    // why these two assertions live in one test.
    const src = readFileSync(join(REPO_ROOT, READER), 'utf8');
    expect(src).toContain('const type = fieldType || "text"');
    // Pinned in FULL, because the claim is about the whole list: these are the
    // six family names, and `string` is not one of them.
    expect(src).toContain(
      'type FilterValueFamily = "text" | "number" | "boolean" | "date" | "datetime" | "time"',
    );
    expect(FilterFieldSchema.safeParse({ value: 'a', label: 'A', type: 'text' }).success).toBe(true);
    // …and `string`, which the renderer names in no bucket (the four are
    // pinned verbatim in the tests above) and in no field-type equality test,
    // is still refused. The pair is the point: one fallthrough, two verdicts,
    // decided by whether the renderer says the word.
    expect(src).not.toContain('type === "string"');
    expect(FilterFieldSchema.safeParse({ value: 'a', label: 'A', type: 'string' }).success).toBe(false);
  });

  it('`type` is OPTIONAL — the renderer reads `fieldType || "text"`', () => {
    // objectui#7562 item 2. `{ value, label }` is what `FilterBuilderProps`
    // declares (`type?: string`) and what a field list stripped of `type`
    // renders as: three text columns, every row still drawn. The mirror
    // refused it until this change, which is the divergence being closed.
    expect(FilterFieldSchema.safeParse({ value: 'a', label: 'A' }).success).toBe(true);
    // Absent is not the same as PRESENT-and-nonsense: the vocabulary is still
    // closed, so this widening cannot be read as "type stopped being checked".
    expect(FilterFieldSchema.safeParse({ value: 'a', label: 'A', type: 'zzz' }).success).toBe(false);
    expect(FilterFieldSchema.safeParse({ value: 'a', label: 'A', type: undefined }).success).toBe(true);
  });

  it('the accept set is EXACTLY the published doc, member for member', () => {
    // The set equality, not fourteen individual accepts: an enum that had
    // gained a fifteenth member the doc never published would pass every
    // per-member assertion above and fail only here.
    //
    // objectui#8774 — the expectation is now READ FROM the doc rather than
    // copied into a constant beside it, which is what makes this fail in BOTH
    // directions instead of one:
    //
    //   - the MIRROR grows a member the doc never published → the mirror
    //     widened past the authority;
    //   - the DOC grows a fifteenth member the mirror does not implement →
    //     the divergence objectui#7562 WAS, in the direction that recreates it.
    //
    // The second one is the whole card: while this compared against a
    // hard-coded list, a member added to the mdx reddened nothing here.
    const declared = mirrorTypeMembers();
    const documented = documentedTypes();
    expect(
      documented.filter((t) => !declared.includes(t)),
      `the published doc offers \`type\` members this mirror refuses. Under decision ` +
        `batch #88 the DOC is the authority and the MIRROR follows — widen ` +
        `FilterFieldSchema.type and FilterField['type'] to match, as its own reviewable ` +
        `change. ⛔ Do NOT narrow ${DOC} to match the mirror. The one exception to ` +
        `"the mirror follows": a spelling a LATER ruling RETIRED from this doc — the ` +
        `way objectui#4814 retired \`owner\` — reappearing in it is a doc REGRESSION, ` +
        `not a widening, and the doc edit is what gets reverted.`,
    ).toEqual([]);
    expect(
      declared.filter((t) => !documented.includes(t)),
      `this mirror accepts \`type\` members ${DOC} never published — the mirror widened ` +
        `past the authority.`,
    ).toEqual([]);
    expect([...declared].sort()).toEqual([...documented].sort());
  });

  it('every member the published doc offers, the mirror ACCEPTS', () => {
    // The behavioural half of the equality above: `.options` is introspection
    // of the enum, this is a parse. Seeded from the doc, so a member added to
    // the mdx is asserted on the day it is added rather than on the day
    // somebody remembers to copy it into a list in this file.
    for (const type of documentedTypes()) {
      expect(
        FilterFieldSchema.safeParse({ value: 'a', label: 'A', type }).success,
        `${DOC} offers \`type: '${type}'\`, which this mirror refuses`,
      ).toBe(true);
    }
  });

  it('the doc reader has a floor — its positive control is the doc\'s own `logic` union', () => {
    // ⚠️ A doc-seeded pin fails the way this repository has failed before: the
    // reader silently matches nothing, the population is empty, and every
    // assertion built on it passes while checking nothing — turning the two
    // tests above vacuous in the same stroke that made them doc-driven. Three
    // legs, so an empty read cannot be mistaken for agreement.
    const doc = publishedDoc();
    // (1) CONTROL — the same reader, the same file, a DIFFERENT block whose
    //     answer is fixed by the ruling at exactly two members. It can fire in
    //     the region under test: a reader that matched nothing, matched the
    //     wrong interface, or stopped at the first line of a multi-line union
    //     returns something that is not `['and','or']`, and this reddens. And
    //     it is independent of the `type?:` block it vouches for, so the thing
    //     being measured cannot be what satisfies it.
    expect(docUnionMembers(doc, 'FilterGroup', 'logic')).toEqual(['and', 'or']);
    // (2) The population itself is non-empty and duplicate-free — a duplicated
    //     member would make the sorted-equality above pass on unequal sets.
    const documented = documentedTypes();
    expect(documented.length).toBeGreaterThan(0);
    expect([...new Set(documented)]).toEqual(documented);
    // (3) A renamed block or a renamed key is a THROW, not an empty set. This
    //     is the leg that keeps (2) from being all that stands between a doc
    //     edit and a pin that has quietly stopped reading anything.
    expect(() => docUnionMembers(doc, 'FilterField', 'nosuchkey?')).toThrow('no longer declares `nosuchkey?`');
    expect(() => docUnionMembers(doc, 'NoSuchInterface', 'type?')).toThrow('no `interface NoSuchInterface {` block');
  });

  it('the gap is measured against the PUBLISHED doc, not against a private opinion', () => {
    // `content/docs/components/complex/filter-builder.mdx` is a THIRD
    // declaration of this component's authoring surface, independent of both
    // faces repaired here, and it already agrees with the renderer: `value` as
    // the field key, `{ id, logic, conditions }` as the group, and a FOURTEEN
    // member `type?` union. This assertion is what makes "the mirror is the odd
    // one out" a reading rather than a claim — and it turns red if someone
    // narrows the DOC to match the mirror, which is the wrong direction.
    const doc = publishedDoc();
    expect(doc).toContain("logic: 'and' | 'or';");
    expect(doc).toMatch(/value: string;\s+\/\/ Field identifier/);
    for (const type of [...RULED, 'select', ...UNRULED_LIVE_TYPES]) {
      expect(doc, `the published doc no longer offers \`${type}\``).toContain(`'${type}'`);
    }
    // …and the doc declares `type` OPTIONAL, which this mirror now does too.
    // Read from the doc rather than restated, so narrowing the DOC to a
    // required `type` reddens here as well — the wrong direction, both ways.
    expect(doc).toContain('type?:');
    expect(FilterFieldSchema.safeParse({ value: 'a', label: 'A' }).success).toBe(true);
  });
});

describe('objectui#6939 — the group shape is `{ id, logic, conditions }`', () => {
  it('accepts the shape the catalog authors and `EMPTY_GROUP` emits', () => {
    expect(FilterGroupSchema.safeParse({ id: 'root', logic: 'and', conditions: [] }).success).toBe(true);
  });

  it('`id` is OPTIONAL — the renderer never reads it', () => {
    // ⚠️ Declared departure — see the header. `isValidGroup` gates on
    // `conditions` and `logic` only, so a group without `id` renders
    // identically; requiring it would invent a refusal.
    expect(FilterGroupSchema.safeParse({ logic: 'or', conditions: [] }).success).toBe(true);
    const src = readFileSync(join(REPO_ROOT, READER), 'utf8');
    expect(src).toContain('Array.isArray((v as FilterGroup).conditions) &&');
    expect(src).toContain('((v as FilterGroup).logic === "and" || (v as FilterGroup).logic === "or")');
  });

  it('`id` is DECLARED, so it is type-checked rather than admitted unvalidated', () => {
    // The reason for declaring a key with no read site: `z.object` strips
    // unknown keys in silence, so an undeclared `id` would accept `42`.
    expect(FilterGroupSchema.safeParse({ id: 42, logic: 'and', conditions: [] }).success).toBe(false);
  });

  it('REFUSES the former `{ operator, conditions }` shape', () => {
    // Breaking half #3, and the loudest of the three at render time: a group
    // spelled this way fails `isValidGroup`, falls back to `EMPTY_GROUP`, and
    // the board empties.
    expect(FilterGroupSchema.safeParse({ operator: 'and', conditions: [] }).success).toBe(false);
  });

  it('`logic` is still a closed vocabulary', () => {
    expect(FilterGroupSchema.safeParse({ id: 'r', logic: 'xor', conditions: [] }).success).toBe(false);
  });
});

describe('objectui#6939 — the catalog entries the mirror refused', () => {
  it.each(['empty-filter-builder', 'user-filters'])(
    '%s now validates under safeValidateSchema',
    (name) => {
      expect(reasons(entry(name))).toEqual([]);
    },
  );

  it.each(['product-search', 'with-conditions'])(
    '%s: the residual refusal is the operator alias and NOTHING else',
    (name) => {
      // ⛔ Do NOT "repair" this by widening `FilterOperatorSchema` or by
      // rewriting the fixtures. Both are outside the ruling and both need one:
      // the builder's dropdown ids (`greaterThan`) and the spec's canonical
      // spellings (`greater_than`) are a genuine fork, and this mirror refuses
      // the former while the RENDERER draws a blank operator trigger for the
      // latter. Reported on objectui#6939.
      expect(reasons(entry(name))).not.toEqual([]);
      expect(reasons(withCanonicalOperators(entry(name)))).toEqual([]);
    },
  );

  it('the `stack`-rooted fifth entry: its nested filter-builder behaves the same way', () => {
    // `search-interface.json` roots at `stack`, so `objectui check` (which runs
    // `safeValidateSchema` on the ROOT only — `packages/cli/src/commands/check.ts:137`)
    // counts four entries for this row, not five. The nested node is measured
    // here so the fifth file is not silently unexamined.
    const node = nestedSearchInterface();
    expect(reasons(node)).not.toEqual([]);
    expect(reasons(withCanonicalOperators(node))).toEqual([]);
  });

  it.each(CENSUS)('%s: none of the THREE ruled divergences is left in it', (name) => {
    // The positive statement behind the split above, key by key.
    const doc = entry(name) as {
      fields: Record<string, unknown>[];
      value: Record<string, unknown>;
    };
    for (const f of doc.fields) {
      expect(FilterFieldSchema.safeParse(f).success).toBe(true);
      expect('name' in f).toBe(false);
    }
    expect(doc.value.logic).toMatch(/^(and|or)$/);
    expect('operator' in doc.value).toBe(false);
  });
});

describe('objectui#6939 — the controls are legal in BOTH states of this change', () => {
  // Every assertion above that changes verdict is paired with a carrier that
  // does not, so a red run cannot be read as "the repair broke something
  // unrelated". These documents parse before AND after: they carry both key
  // spellings at once (the extra one is stripped in each state) and a `type`
  // that is a member of both enums.
  const bothWays = {
    type: 'filter-builder',
    name: 'x',
    fields: [{ name: 'a', value: 'a', label: 'A', type: 'select' }],
    value: { id: 'r', operator: 'and', logic: 'and', conditions: [] },
  };

  it('the both-spellings carrier validates', () => {
    expect(reasons(bothWays)).toEqual([]);
  });

  it('and it is genuinely reaching FilterBuilderSchema, not some other union arm', () => {
    expect(FilterBuilderSchema.safeParse(bothWays).success).toBe(true);
  });

  it('a `fields` entry that is not an object still refuses, in either state', () => {
    expect(FilterBuilderSchema.safeParse({ ...bothWays, fields: ['a'] }).success).toBe(false);
  });
});

describe('objectui#6939 — the keys are DECLARED, not passthrough holes', () => {
  it('both mirrors expose the ruled keys and no stale one', () => {
    expect(Object.keys((FilterFieldSchema as unknown as { shape: Record<string, unknown> }).shape))
      .toEqual(['value', 'label', 'type', 'operators', 'options']);
    // `FilterGroupSchema` is a `z.lazy`, so its shape is behind the thunk.
    const group = (FilterGroupSchema as unknown as { _def: { getter: () => { shape: Record<string, unknown> } } })
      ._def.getter();
    expect(Object.keys(group.shape)).toEqual(['id', 'logic', 'conditions']);
  });

  it('the unused type-level bindings above are referenced, so lint keeps them', () => {
    expect(groupWithoutId.conditions).toEqual([]);
    expect(legacyNamedField).toBeDefined();
    expect(fieldWithoutType.value).toBe('a');
  });
});
