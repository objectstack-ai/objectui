/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8649 — the twelve undeclared reads across four record renderers do
 * NOT share one cause and do NOT share one exit. This file is the instrument
 * for every claim the ruling rests on, so each is re-derived on every run
 * instead of being written down once (AGENTS.md #9).
 *
 * ## The two causes, measured with the checker (objectui#8410: never a grep)
 *
 *   - `record-details.tsx`, `record-highlights.tsx` and `record-related-list.tsx`
 *     annotate `schema` correctly and then destructure it as `schema = {} as any`.
 *     A destructuring default's type joins the annotation at the binding, so
 *     `any` ERASED the annotation for every read site in the file — declared
 *     keys (`hideFields`, `add`, `columns`, `sort`, …) and undeclared ones
 *     (`enforceFieldSecurity`, …) alike read `any`, indistinguishably. That is a
 *     local type defect with no published-surface consequence, and repairing it
 *     is the prerequisite to classifying anything: before it, the checker cannot
 *     tell an author's key from a host's at any of those sites.
 *   - `record-reference-rail.tsx` has the OTHER cause. Its `schema` type is not
 *     erased; `properties` is simply not a declared member of it and compiles
 *     through the `[k: string]: any` index signature.
 *
 * ## The exits, one per key — determined by the contract, not by preference
 *
 * `@object-ui/types` is a MIRROR of `@objectstack/spec`, not an authority, so
 * declaring a key the platform does not declare would make this repo accept what
 * the platform refuses. The question per key is therefore: does the contract
 * declare it, and on WHICH schema? Both halves matter — a token that exists
 * somewhere under the UI contract is not a declaration on the schema a given
 * node maps to. {@link declaringSchemasOf} answers exactly that, over the
 * installed published artifact, every run.
 *
 *   - `hideFields` (`record-details`) — DECLARED, on `RecordDetailsProps` and
 *     already on this repo's mirror since objectui#9040. The card listed it only
 *     because the erasure hid it. ⇒ nothing to rule; the erasure repair alone
 *     makes the checker see it.
 *   - `relationshipValueField` (`record-related-list`) — DECLARED on
 *     `RecordRelatedListProps` and published by this block's registry `inputs`
 *     (`recordRelatedListInputs.spec-parity.test.ts`), while the mirror
 *     interface omitted it. That is objectui#9040's Direction 1 one interface
 *     over: a spec-valid, renderer-honoured, registry-published document refused
 *     by `tsc` with `TS2353`. ⇒ ALIGN THE MIRROR.
 *   - `properties` (`record-reference-rail`) — DECLARED by the contract at NODE
 *     level on `PageComponentSchema` ("Component props passed to the widget"),
 *     which is the same standing `dataSource` and `className` have in
 *     `recordRelatedListInputs.spec-parity.test.ts`. ⇒ ALIGN THE MIRROR, for the
 *     one member this renderer reads off the envelope.
 *   - `enforceFieldSecurity` and `redactFields` (three renderers each) — declared
 *     on NO object schema the UI contract exports. ⇒ "declare" is off the table
 *     outright. ROUTED TO THE PRODUCER, ⛔ not retired here: the renderers honour
 *     both keys today on the raw-node path, so deleting the reads would remove a
 *     redaction that is working, and changing runtime masking behaviour is the
 *     maintainer floor this card must not cross.
 *   - `requiredPermissions` (three renderers each) — the sharpest of the twelve.
 *     The contract DOES declare it, including on the sibling page-component
 *     props schema `RecordQuickActionsProps`, but NOT on the three this card
 *     covers. A word-frequency screen over the contract reads "present" and is
 *     wrong about exactly this; the per-schema census below is what separates
 *     them. ⇒ ROUTED TO THE PRODUCER, same floor.
 *
 * ## What each leg can and cannot prove
 *
 *   - The `Equal` legs are compiled by `tsc -p tsconfig.test.json` and by nothing
 *     else — vitest strips types. They are the ONLY half that discriminates the
 *     two mirror alignments from their defect, because that defect was a
 *     TypeScript-only refusal.
 *   - The census legs read the INSTALLED `@objectstack/spec` artifact. They are
 *     the PREMISE of the routing decision, never its evidence: they were green
 *     before this card and are green after. They earn their place by going RED
 *     the day the platform declares one of the routed keys — which is the signal
 *     that the routed card landed and this repo owes the mirror an update.
 *   - The source-text legs read the three renderers through the shared comment
 *     mask, so a re-introduced `{} as any` is caught by a run that never
 *     type-checks. Each carries a control that varies only the claim.
 *   - {@link ROUTED_KEYS} is a LEDGER, and a stale exception is a hole: every
 *     entry is asserted to be STILL READ by the file it is ledgered against. If
 *     someone retires one of these reads, this file goes red and the routing
 *     claim has to be re-derived rather than quietly outliving its subject.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as specUi from '@objectstack/spec/ui';
import {
  ComponentPropsMap,
  PageComponentSchema,
  RecordRelatedListProps,
  type ComponentPropsInput,
  type ReferenceRailEntry,
} from '@objectstack/spec/ui';
import type { RecordRelatedListComponentProps } from '@object-ui/types';
import type { RecordReferenceRailRendererProps } from '../record-reference-rail';
// @ts-expect-error — plain-JS shared helper, intentionally untyped (`allowJs: false`)
import { maskComments } from '../../../../../scripts/js-comment-mask.mjs';

/** Local annotation, since the import above is untyped — the call site stays checked. */
const mask: (source: string) => string = maskComments;

/** Rooted at THIS file, never at `process.cwd()` — the two differ per invocation. */
const HERE = dirname(fileURLToPath(import.meta.url));
const RENDERERS = join(HERE, '..');

/* ── Type-level pins (compiled by `tsc -p tsconfig.test.json`) ─────────────── */

/**
 * What an author writes for the spec's `record:related_list` props bag, reached
 * through the contract's own block-tag map rather than through a named schema
 * export — so the pin is bound to the tag this renderer registers. `zod` is not
 * a dependency of this package and must not become one for a type alias; the
 * contract already publishes this derivation.
 *
 * The map entry and the named export being the SAME schema is the premise of
 * that indirection, and it is asserted at runtime below rather than assumed.
 */
type SpecRelatedListProps = ComponentPropsInput<'record:related_list'>;

/** Invariant type equality. `A extends B` is NOT this: `never` and `any` pass that. */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** The only assertion form used here — its constraint is what refuses `false`. */
type Expect<T extends true> = T;

/* Direction proofs: a broken instrument makes THIS file red. */

// @ts-expect-error objectui#8649 — `Expect` must refuse `false`. Widen its constraint and this directive goes unused (TS2578).
type _ExpectRefusesFalse = Expect<false>;

// @ts-expect-error objectui#8649 — `never` must NOT read as equal to `true`. An `extends`-shaped comparison would let it through.
type _EqualRefusesNever = Expect<Equal<never, true>>;

// @ts-expect-error objectui#8649 — `any` must NOT read as equal to `true`. This is the exact shape the erasure produced.
type _EqualRefusesAny = Expect<Equal<any, true>>;

/* Exit "align the mirror", key 1: `relationshipValueField`. */

/** RED before objectui#8649 (`TS2339` — the member did not exist here). */
export type _RelationshipValueFieldMirrorsSpec = Expect<
  Equal<
    RecordRelatedListComponentProps['relationshipValueField'],
    SpecRelatedListProps['relationshipValueField']
  >
>;

/**
 * Spelled out as well as derived. `Equal` against the spec alone would also be
 * satisfied if BOTH faces drifted to the same wrong type.
 */
export type _RelationshipValueFieldIsOptionalString = Expect<
  Equal<RecordRelatedListComponentProps['relationshipValueField'], string | undefined>
>;

/**
 * The card's repro as a literal: spec-valid, renderer-honoured, registry-published,
 * and refused by `tsc` with `TS2353` before this card.
 */
const relationshipValueFieldAccepted: RecordRelatedListComponentProps = {
  objectName: 'task',
  relationshipField: 'account',
  relationshipValueField: 'name',
};

/* Exit "align the mirror", key 2: the reference rail's node-level `properties`. */

type RailSchema = NonNullable<RecordReferenceRailRendererProps['schema']>;

/**
 * RED before objectui#8649: `properties` was admitted only by the schema type's
 * `[k: string]: any` index signature, so it read `any` — which `Equal` refuses
 * (see `_EqualRefusesAny` above, the same shape).
 */
export type _RailPropertiesIsDeclared = Expect<
  Equal<RailSchema['properties'], ({ entries?: ReferenceRailEntry[] } & Record<string, any>) | undefined>
>;

/**
 * And the member the renderer actually reads off the envelope carries the
 * contract's own entry type, not `any`.
 */
export type _RailPropertiesEntriesIsSpecEntry = Expect<
  Equal<NonNullable<RailSchema['properties']>['entries'], ReferenceRailEntry[] | undefined>
>;

/* ── Runtime legs ─────────────────────────────────────────────────────────── */

/**
 * Every key name declared on `schema`, unwrapping the wrappers a published zod
 * artifact uses (`.pipe()` — which `PageComponentSchema` is — plus
 * `.optional()` / `.default()`), or `null` when `schema` is not an object
 * schema at all.
 */
function objectShapeKeys(schema: unknown): string[] | null {
  let node = schema as
    | { shape?: unknown; _def?: { shape?: unknown; in?: unknown; innerType?: unknown; type?: unknown } }
    | undefined;
  for (let hop = 0; hop < 8; hop += 1) {
    // ⚠️ zod 4 schemas are CALLABLE, so a `typeof !== 'object'` guard here is not
    // a type check — it is a silent census cut. Measured: it dropped 96 of the
    // 115 object schemas the contract exports, and every "declared nowhere"
    // reading taken through it would have been vacuous. The population leg in
    // the first block is what caught it, and is why it is written as a floor.
    if (!node || (typeof node !== 'object' && typeof node !== 'function')) return null;
    let shape: unknown;
    try {
      shape = node.shape ?? node._def?.shape;
    } catch {
      return null;
    }
    const resolved = typeof shape === 'function' ? (shape as () => object)() : shape;
    if (resolved && typeof resolved === 'object') return Object.keys(resolved);
    node = (node._def?.in ?? node._def?.innerType ?? node._def?.type) as typeof node;
  }
  return null;
}

/**
 * The census this card's routing rests on: which EXPORTED object schemas of the
 * installed UI contract declare `key`. Derived from the artifact on every run —
 * never a list written down here.
 */
function declaringSchemasOf(key: string): string[] {
  const found: string[] = [];
  for (const [name, value] of Object.entries(specUi as Record<string, unknown>)) {
    const keys = objectShapeKeys(value);
    if (keys?.includes(key)) found.push(name);
  }
  return found.sort();
}

/** How many exported object schemas the census actually walked. */
const censusPopulation = (): number =>
  Object.values(specUi as Record<string, unknown>).filter((v) => objectShapeKeys(v) !== null).length;

/** The three props schemas this card's renderers map to. */
const CARD_PROPS_SCHEMAS = ['RecordDetailsProps', 'RecordHighlightsProps', 'RecordRelatedListProps'] as const;

/**
 * The keys routed to the producer, and the renderer files each is ledgered
 * against. Every entry is asserted STILL READ below — a ledger entry whose
 * subject has gone is a hole, not a pass.
 */
const ROUTED_KEYS = {
  enforceFieldSecurity: ['record-details.tsx', 'record-highlights.tsx', 'record-related-list.tsx'],
  redactFields: ['record-details.tsx', 'record-highlights.tsx', 'record-related-list.tsx'],
  requiredPermissions: ['record-details.tsx', 'record-highlights.tsx', 'record-related-list.tsx'],
} as const;

/** The three files whose `schema` annotation the erasure used to destroy. */
const ERASURE_REPAIRED = [
  'record-details.tsx',
  'record-highlights.tsx',
  'record-related-list.tsx',
] as const;

const maskedSource = (file: string): string => mask(readFileSync(join(RENDERERS, file), 'utf8'));

/** The erasing spelling, as a matcher — applied to real sources AND to a control. */
const ERASING_DEFAULT = /schema\s*=\s*\{\}\s*as\s+any/;

describe('objectui#8649 — the census the routing rests on (PREMISE, re-derived every run)', () => {
  it('walks a non-empty population and discriminates', () => {
    // Calibration in both directions: an empty walk would make every "declared
    // nowhere" reading below vacuous, and an everything-set would make them
    // unfalsifiable.
    expect(censusPopulation()).toBeGreaterThan(50);
    expect(declaringSchemasOf('zzqx_no_such_key')).toEqual([]);
    expect(declaringSchemasOf('aria').length).toBeGreaterThan(0);
    expect(declaringSchemasOf('fields').length).toBeGreaterThan(0);
  });

  it('`enforceFieldSecurity` and `redactFields` are declared on NO exported UI-contract schema', () => {
    // The reading that takes "declare" off the table for these two. It goes RED
    // the day the platform declares either — which is the signal that the routed
    // producer-side card landed.
    expect(declaringSchemasOf('enforceFieldSecurity')).toEqual([]);
    expect(declaringSchemasOf('redactFields')).toEqual([]);
  });

  it('`requiredPermissions` IS declared by the contract — just never on these three props schemas', () => {
    // Why a word-frequency screen gets this key wrong, stated as an assertion
    // rather than as prose: the token is present AND the declaration is absent
    // where these renderers read it.
    const declaring = declaringSchemasOf('requiredPermissions');
    expect(declaring.length).toBeGreaterThan(0);
    // The sibling page-component props schema that DOES carry it — the precedent
    // the producer-side card would cite.
    expect(declaring).toContain('RecordQuickActionsProps');
    for (const schema of CARD_PROPS_SCHEMAS) expect(declaring).not.toContain(schema);
  });

  it('the block-tag map entry IS the named props schema (premise of the type pins)', () => {
    // The `ComponentPropsInput<'record:related_list'>` alias above is only a
    // reading of `RecordRelatedListProps` while this holds.
    expect(ComponentPropsMap['record:related_list']).toBe(RecordRelatedListProps);
  });

  it('the two mirror alignments are alignments — the contract declares both keys', () => {
    expect(declaringSchemasOf('relationshipValueField')).toContain('RecordRelatedListProps');
    expect(declaringSchemasOf('hideFields')).toContain('RecordDetailsProps');
    // `properties` is a NODE-level key, so it is declared on the page-component
    // node rather than on any block's props bag.
    expect(declaringSchemasOf('properties')).toContain('PageComponentSchema');
    expect(objectShapeKeys(PageComponentSchema)).toContain('dataSource');
    expect(objectShapeKeys(PageComponentSchema)).not.toContain('relationshipField');
  });
});

describe('objectui#8649 — the erasure is repaired and stays repaired', () => {
  it('the matcher can fire, so a zero reading below is a reading', () => {
    // The control varies ONLY the claim: same matcher, same shape of source, the
    // erasing spelling restored.
    expect(ERASING_DEFAULT.test('const C = ({ schema = {} as any, className }) => null;')).toBe(true);
  });

  for (const file of ERASURE_REPAIRED) {
    it(`${file} destructures \`schema\` without erasing its annotation`, () => {
      const source = maskedSource(file);
      // Proof the file was read and masked, so the absence below is about the
      // spelling and not about an empty string.
      expect(source).toMatch(/RecordDetailsRendererProps|RecordHighlightsRendererProps|RecordRelatedListRendererProps/);
      expect(source).not.toMatch(ERASING_DEFAULT);
      // And the repaired spelling is the annotation-tracking one, so a future
      // change to the annotation cannot silently re-erase it.
      expect(source).toMatch(/schema\s*=\s*\{\}\s*as\s+NonNullable<\s*Record\w+RendererProps\['schema'\]\s*>/);
    });
  }
});

describe('objectui#8649 — the routed-key ledger is not stale', () => {
  for (const [key, files] of Object.entries(ROUTED_KEYS)) {
    for (const file of files) {
      it(`${file} still reads \`${key}\` (ledger entry stays live)`, () => {
        const source = maskedSource(file);
        expect(source).toContain(`.${key}`);
      });
    }
  }

  it('the rail still reads the node-level `properties` envelope it now declares', () => {
    expect(maskedSource('record-reference-rail.tsx')).toMatch(/properties\??\.entries/);
  });

  it('the ledger matcher can fire negative, so the legs above are readings', () => {
    expect(mask('const x = 1;')).not.toContain('.enforceFieldSecurity');
  });
});

describe('objectui#8649 — the aligned mirror keys reach the renderers', () => {
  it('`relationshipValueField` is accepted by the mirror at the type level', () => {
    // The compile-time legs are the discriminating half; this keeps the literal
    // reachable from a vitest run so the fixture cannot rot unnoticed.
    expect(relationshipValueFieldAccepted.relationshipValueField).toBe('name');
  });

  it('the contract accepts the same document, so mirror and contract agree', () => {
    const parsed = RecordRelatedListProps.safeParse({
      objectName: 'task',
      relationshipField: 'account',
      columns: ['name'],
      relationshipValueField: 'name',
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.relationshipValueField).toBe('name');
  });
});
