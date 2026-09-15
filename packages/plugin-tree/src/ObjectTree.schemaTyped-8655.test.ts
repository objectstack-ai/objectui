/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8655 — `ObjectTreeProps.schema` is the published `object-tree` node,
 * and every key this renderer reads off it now has an ANSWER.
 *
 * ## The card's ordering, and why it is the whole point
 *
 * `ObjectTreeProps` declared `schema: any`. Two reads — `data` and
 * `navigation` — were filed as class (d), *structurally unanswerable*, ⛔ not
 * as "undeclared": `checker.getPropertyOfType` through `any` returns
 * `undefined` for `objectName`, a key this node certainly declares, exactly as
 * it does for a nonsense token. An absence returned by an instrument unable to
 * see a declaration is not a reading (objectui#8410). So the order was ① type
 * the prop, ② re-run the checker, ③ classify — and ⛔ never ③ first.
 *
 * The answerability control is pinned below and it FIRES: `Declares` answers
 * `false` for both a real member and a nonsense token when asked of `any`, and
 * separates them when asked of the node.
 *
 * ## What ② returned, and what ① surfaced on the way
 *
 * Both class-(d) reads changed status, in OPPOSITE directions, and the second
 * of them is the outcome the card warned to expect:
 *
 *   - `data` is **DECLARED** — on `BaseSchema` ("Arbitrary data attached to the
 *     component"). The `(schema as any)` at that read was hiding a declaration,
 *     not reaching past its absence, so the cast is gone. This is the same
 *     shape objectui#8655's body recorded for plugin-detail's `add`.
 *   - `navigation` is **UNDECLARED** — it survives on `BaseSchema`'s
 *     `[key: string]: any` alone.
 *
 * ⚠️ And typing the prop made SIX more reads answerable that `any` had hidden —
 * the card calls that the expected outcome, ⛔ not scope creep. Five are
 * declared (`objectName` `parentField` `labelField` `fields`
 * `defaultExpandedDepth`); one, `filter`, is not.
 *
 * ## ③ — the family ruling, applied per key, each with its own reading
 *
 * The ruling (objectui#8327 triage): does `@objectstack/spec` declare this key,
 * and on which schema? declared ⇒ align the mirror; not declared ⇒ "declare" is
 * off the table and the exit is retire-the-read or route-to-producer.
 *
 * ⚠️ One reading governs all three, and it is measured below rather than
 * assumed: the installed `@objectstack/spec` has **no `ComponentPropsMap` entry
 * for `object-tree` at all** (nor for `tree`), while `object-calendar` and
 * `object-grid` are present. So no key can be confirmed on "the element schema
 * this node maps to" — there is none. Each verdict therefore names the schema
 * the spec DOES declare the key on, and says what follows:
 *
 *   - **`navigation` — ⛔ NOT RULED HERE.** objectui#8652's family, maintainer
 *     ruled option B (declare on the platform element schemas first, then
 *     mirror), `pm:blocked` on objectstack#17987, unlock criterion = a released
 *     spec carrying the declaration installable here. Measured: `navigation` is
 *     declared on exactly ONE element entry, `object-grid` — so the unlock has
 *     not happened. Ledgered by name, read untouched.
 *   - **`filter` — DECLARE, and ⛔ not executed on this branch.** The spec
 *     declares it on `ListView` and on four comparable `object-*` element
 *     entries; this repo's mirror declares it on every sibling node schema and
 *     omits it on this one alone. That is align-the-mirror. ⛔ It is not done
 *     here because `packages/types/src/objectql.ts` and its zod twin are held
 *     by an in-flight branch (objectui#9309), and the declared handling for
 *     that breach is to stop and report. Ledgered; the row below reddens the
 *     day it is declared, which is when this ledger should be retired.
 *   - **`tree` — ⛔ declare is OFF THE TABLE, and this card does not retire
 *     it.** The spec declares `tree` on the VIEW (`ListView.tree`, mirrored
 *     here as `TreeViewConfig`) and on ZERO element entries. Putting a
 *     view-level block on a node schema is not mirroring the contract, it is
 *     forking it. Retiring the read is the other exit and it needs a producer
 *     census this card cannot soundly make: producers deliver these keys by
 *     SPREADING the block flat, and a text census is structurally blind to a
 *     key arriving through a spread (objectui#8651 measured exactly that
 *     failure and had to withdraw a retirement). ⇒ routed, rung untouched.
 *
 * ## The ceiling, stated so nobody reads this file as claiming more
 *
 * `BaseSchema` ends in `[key: string]: any`. Typing the prop makes the question
 * ANSWERABLE; it refuses nothing at the read site and rejects no misspelling
 * (objectui#5155 / objectui#7927). The counter-probe below pins that honestly.
 */
/// <reference types="node" />
// ⚠️ The triple-slash reference is the route, ⛔ not an oversight. This package's
// `tsconfig.test.json` leaves `types` unset, so naming it there would switch OFF
// automatic `@types/*` inclusion for every other test in the package; the
// per-file reference registers Node's globals for this program alone. Both
// routes are documented by `scripts/tsconfig-test-parity-census.mjs`, which reads
// them off the resolved program rather than off the config text.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { ComponentPropsMap, TreeConfigSchema } from '@objectstack/spec/ui';
import {
  ObjectTreeSchema as ObjectTreeMirror,
  ObjectGridSchema as ObjectGridMirror,
  ObjectMapSchema as ObjectMapMirror,
  ObjectGanttSchema as ObjectGanttMirror,
  ObjectCalendarSchema as ObjectCalendarMirror,
  ObjectKanbanSchema as ObjectKanbanMirror,
  ObjectChartSchema as ObjectChartMirror,
  ObjectGallerySchema as ObjectGalleryMirror,
  ObjectDataTableSchema as ObjectDataTableMirror,
} from '@object-ui/types/zod';
import type { ObjectQLComponentSchema } from '@object-ui/types';

import type { ObjectTreeProps } from './ObjectTree';

// @ts-expect-error — plain-JS shared helper, intentionally untyped (`allowJs: false`)
import { maskComments } from '../../../scripts/js-comment-mask.mjs';

/** Local annotation, since the import above is untyped — the call site stays checked. */
const mask: (source: string) => string = maskComments;

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..');
const TREE_READER = 'packages/plugin-tree/src/ObjectTree.tsx';

/** The node the checker now sees at every read, spelled the way the renderer spells it. */
type ObjectTreeNode = Extract<ObjectQLComponentSchema, { type: 'object-tree' }>;

/** A key nothing reads and nothing declares — the both-ways control. */
const CONTROL_KEY = 'zzplTreeAbsentControl8655' as const;

/**
 * ③'s three answers, by name. Every entry is asserted STILL READ below: a
 * ledger whose subject has gone is a hole, not an exemption (objectui#8885).
 */
const LEDGERED_UNDECLARED = ['navigation', 'filter', 'tree'] as const;

/* ── Instruments ──────────────────────────────────────────────────────────── */

function readRepo(rel: string): string {
  return readFileSync(join(REPO_ROOT, rel), 'utf8');
}

/**
 * Every key read off the schema node, in EITHER spelling — the bare
 * `schema.KEY` and the cast `(schema as any).KEY`. Both spell the same FACT,
 * and reading the fact rather than the spelling is what stops these verdicts
 * reddening when a cast is removed (objectui#8832). Borrowed verbatim from
 * `plugin-calendar`'s `calendarUnionReads-8651` census.
 */
const SCHEMA_READ = /(?:\bschema\b|\(\s*schema\s+as\s+[^)]*\))\s*\.\s*([A-Za-z_$][\w$]*)/g;

function schemaReads(source: string): Set<string> {
  return new Set([...source.matchAll(SCHEMA_READ)].map((m) => m[1]));
}

/** The renderer's reads, with prose masked so a key named only in a comment cannot vote. */
function rendererReads(): Set<string> {
  return schemaReads(mask(readRepo(TREE_READER)));
}

/** Declared membership, off a mirror's OWN shape — never off parse acceptance. */
function shapeKeys(schema: unknown): string[] {
  return Object.keys((schema as { shape: Record<string, unknown> }).shape);
}

/**
 * ⚠️ `ComponentPropsMap` entries are read through `Record<string, any>` on
 * purpose: `_def` is a zod INTERNAL for which the spec publishes no type, so a
 * hand-written shape for it would be a local assertion about a third-party
 * runtime that nothing re-checks. Same decision as objectui#8651's pin.
 */
function specElementKeys(type: string): string[] | null {
  const entry = (ComponentPropsMap as unknown as Record<string, any>)[type];
  if (!entry?._def) return null;
  const def = entry._def;
  const shape = typeof def.shape === 'function' ? def.shape() : def.shape;
  if (!shape || typeof shape !== 'object') return null;
  return Object.keys(shape);
}

function specElementsDeclaring(key: string): string[] {
  return Object.keys(ComponentPropsMap as unknown as Record<string, unknown>)
    .filter((type) => (specElementKeys(type) ?? []).includes(key))
    .sort();
}

/* ── Compile-time pins (compiled by `tsc -p tsconfig.test.json`) ───────────── */

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;
/** The canonical `any` detector: only `any` absorbs `1 &` down to something `0` extends. */
type IsAny<T> = 0 extends (1 & T) ? true : false;

/**
 * ⭐ THE instrument of this card, at the type level: the DECLARED member names
 * of `T`, with any index signature removed by key remapping. `keyof` alone
 * cannot answer — `BaseSchema` ends in `[key: string]: any`, so `keyof` of any
 * node schema is `string | number` and every token "extends" it. That is the
 * same blindness `checker.getPropertyOfType` avoids by returning a SYMBOL only
 * for a real member, and this is its compile-time twin.
 */
type DeclaredKeys<T> = keyof {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K];
};
type Declares<T, K extends PropertyKey> = K extends DeclaredKeys<T> ? true : false;

/** ① — the prop is the published node, derived off the union, and it is not `any`. */
export type _PropIsThePublishedNode = Expect<Equal<ObjectTreeProps['schema'], ObjectTreeNode>>;
export type _PropIsNotAnyAnyMore = Expect<Equal<IsAny<ObjectTreeProps['schema']>, false>>;
/** The `Equal` helper can FAIL — synthetic control, so the two rows above count. */
export type _EqualCanFail = Expect<Equal<Equal<any, ObjectTreeNode>, false>>;

/**
 * ⭐ THE ANSWERABILITY CONTROL, and it is the card's whole argument in two
 * lines. Asked of `any`, the instrument gives the SAME answer for a member the
 * node certainly declares and for a nonsense token — which is why the
 * pre-objectui#8655 reading was "unknown", ⛔ never "undeclared".
 */
export type _ThroughAnyARealMemberIsUnanswerable =
  Expect<Equal<Declares<any, 'objectName'>, false>>;
export type _ThroughAnyANonsenseTokenReadsTheSame =
  Expect<Equal<Declares<any, typeof CONTROL_KEY>, false>>;
/** …and asked of the NODE, the same instrument separates them. */
export type _OnTheNodeARealMemberIsDeclared = Expect<Declares<ObjectTreeNode, 'objectName'>>;
export type _OnTheNodeANonsenseTokenIsNot =
  Expect<Equal<Declares<ObjectTreeNode, typeof CONTROL_KEY>, false>>;

/** ② — the per-key readings, one row per key, ⛔ no verdict by analogy. */
export type _DataIsDeclared = Expect<Declares<ObjectTreeNode, 'data'>>;
export type _ObjectNameIsDeclared = Expect<Declares<ObjectTreeNode, 'objectName'>>;
export type _ParentFieldIsDeclared = Expect<Declares<ObjectTreeNode, 'parentField'>>;
export type _LabelFieldIsDeclared = Expect<Declares<ObjectTreeNode, 'labelField'>>;
export type _FieldsIsDeclared = Expect<Declares<ObjectTreeNode, 'fields'>>;
export type _DefaultExpandedDepthIsDeclared =
  Expect<Declares<ObjectTreeNode, 'defaultExpandedDepth'>>;
export type _NavigationIsUndeclared = Expect<Equal<Declares<ObjectTreeNode, 'navigation'>, false>>;
export type _FilterIsUndeclared = Expect<Equal<Declares<ObjectTreeNode, 'filter'>, false>>;
export type _TreeIsUndeclared = Expect<Equal<Declares<ObjectTreeNode, 'tree'>, false>>;

/**
 * ⚠️ THE CEILING. An undeclared key still compiles and still types `any`, so
 * declaring buys VALUE typing and never buys refusal of a misspelling. Both
 * halves are pinned: the ledgered keys resolve to `any`, and so does a typo.
 */
export type _UndeclaredStillResolvesToAny = Expect<IsAny<ObjectTreeNode['navigation']>>;
export type _MisspellingStillAdmitted = Expect<IsAny<ObjectTreeNode['objectNaem']>>;

/** The node still type-checks the way a host writes it, with no cast. */
const node: ObjectTreeProps['schema'] = {
  type: 'object-tree',
  objectName: 'duly_task',
  parentField: 'parent_id',
  labelField: 'name',
  fields: ['owner'],
  defaultExpandedDepth: 1,
};

/* ── 1. Non-vacuity: the instruments can see the tree ──────────────────────── */

describe('objectui#8655 — the instruments are reading something (guards every row below)', () => {
  it('the read census sees the renderer, and invents nothing', () => {
    const reads = rendererReads();
    expect(reads.size).toBeGreaterThan(5);
    expect([...reads]).toContain('objectName');
    expect(reads.has(CONTROL_KEY)).toBe(false);
  });

  it('the census fires on BOTH spellings, so a cast removal cannot mute it', () => {
    const probe = schemaReads('const a = schema.alphaKey; const b = (schema as any).betaKey;');
    expect([...probe].sort()).toEqual(['alphaKey', 'betaKey']);
  });

  it('the mirror shape is a real set, not everything', () => {
    expect(shapeKeys(ObjectTreeMirror)).toContain('parentField');
    expect(shapeKeys(ObjectTreeMirror)).not.toContain(CONTROL_KEY);
  });

  it('the spec reader resolves entries that exist and refuses one that does not', () => {
    expect(specElementKeys('object-grid')).toContain('objectName');
    expect(specElementKeys(CONTROL_KEY)).toBeNull();
  });

  it('the type-face literal is real', () => {
    expect(node.type).toBe('object-tree');
  });
});

/* ── 2. The population: every read is declared, or ledgered by name ─────────── */

describe('objectui#8655 — every key read off the node is declared, or ledgered', () => {
  it('no read is undeclared outside the three ledgered keys', () => {
    const reads = rendererReads();
    const declared = new Set(shapeKeys(ObjectTreeMirror));
    const exempt = new Set<string>(LEDGERED_UNDECLARED);
    const undeclared = [...reads]
      .filter((key) => !declared.has(key))
      .filter((key) => !exempt.has(key))
      .sort();
    expect(undeclared, `undeclared reads on the object-tree node: ${undeclared.join(', ')}`)
      .toEqual([]);
  });

  it('the ledger is not stale: every carve-out is STILL READ', () => {
    const reads = rendererReads();
    for (const key of LEDGERED_UNDECLARED) {
      expect([...reads], `${key} is ledgered but no longer read — the exception is a hole`)
        .toContain(key);
    }
  });

  it('`data` is declared — the class-(d) read that changed direction', () => {
    // The card warned to expect this: on plugin-detail the same prerequisite
    // turned one apparently-undeclared key into a declared one. Here it is
    // `data`, declared on `BaseSchema` and reached through the mirror's own
    // shape rather than through parse acceptance.
    expect(shapeKeys(ObjectTreeMirror)).toContain('data');
  });
});

/* ── 3. ③ — the spec readings each verdict rests on ────────────────────────── */

describe('objectui#8655 — the spec has no element schema for this node', () => {
  it('no `object-tree` entry, and no `tree` entry (controls: two that ARE there)', () => {
    expect(specElementKeys('object-tree')).toBeNull();
    expect(specElementKeys('tree')).toBeNull();
    // FIRING CONTROLS on those two nulls — without them a broken reader and a
    // real absence give the same answer.
    expect(specElementKeys('object-calendar')).toBeTruthy();
    expect(specElementKeys('object-grid')).toBeTruthy();
  });
});

describe('objectui#8655 — `navigation` is objectui#8652\'s, and the unlock has not happened', () => {
  it('the spec declares it on ONE element entry, and it is not this one', () => {
    const declaring = specElementsDeclaring('navigation');
    expect(declaring).toContain('object-grid');
    expect(declaring).not.toContain('object-tree');
    expect(declaring).not.toContain('object-calendar');
  });

  it('⛔ and it stays UNDECLARED here — this card must not rule the family', () => {
    expect(shapeKeys(ObjectTreeMirror)).not.toContain('navigation');
  });
});

describe('objectui#8655 — `filter` is the one DECLARE verdict, and it is not executed here', () => {
  it('the spec declares it on the comparable `object-*` element faces', () => {
    const declaring = specElementsDeclaring('filter');
    for (const el of ['object-grid', 'object-kanban', 'object-calendar', 'object-metric']) {
      expect(declaring, `${el} should declare filter`).toContain(el);
    }
  });

  it('every sibling node mirror in THIS repo declares it — this one alone does not', () => {
    // The align-the-mirror ground, re-derived rather than written down.
    const siblings: [string, unknown][] = [
      ['ObjectGridSchema', ObjectGridMirror],
      ['ObjectMapSchema', ObjectMapMirror],
      ['ObjectGanttSchema', ObjectGanttMirror],
      ['ObjectCalendarSchema', ObjectCalendarMirror],
      ['ObjectKanbanSchema', ObjectKanbanMirror],
      ['ObjectChartSchema', ObjectChartMirror],
      ['ObjectGallerySchema', ObjectGalleryMirror],
      ['ObjectDataTableSchema', ObjectDataTableMirror],
    ];
    for (const [name, mirror] of siblings) {
      expect(shapeKeys(mirror), `${name} should declare filter`).toContain('filter');
    }
    // ⚠️ This row is the LEDGER, not an endorsement: it reddens the day the
    // declare verdict is executed, which is exactly when this ledger is due to
    // be retired. ⛔ Do not "fix" it by deleting the ledger — declare the key.
    expect(shapeKeys(ObjectTreeMirror)).not.toContain('filter');
  });
});

describe('objectui#8655 — `tree` is a VIEW-level block, so declaring it on the node would fork', () => {
  it('the spec declares the block, and its members are the four this resolver reads', () => {
    const blockKeys = Object.keys(
      (TreeConfigSchema as unknown as { shape: Record<string, unknown> }).shape,
    ).sort();
    expect(blockKeys).toEqual(['defaultExpandedDepth', 'fields', 'labelField', 'parentField']);
  });

  it('…and NO element face declares a `tree` key (control: one key that IS on four)', () => {
    expect(specElementsDeclaring('tree')).toEqual([]);
    // FIRING CONTROL on that zero, same instrument, same corpus.
    expect(specElementsDeclaring('filter').length).toBeGreaterThan(3);
  });

  it('⛔ so it is not declared here either', () => {
    expect(shapeKeys(ObjectTreeMirror)).not.toContain('tree');
  });
});

/* ── 4. The ceiling, at runtime as well as at compile time ─────────────────── */

describe('objectui#8655 — the objectui#7927 ceiling is UNCHANGED', () => {
  it('a misspelled key still rides through the mirror', () => {
    const base = { type: 'object-tree', objectName: 'duly_task' };
    expect(ObjectTreeMirror.safeParse({ ...base, parentFeild: 'parent_id' }).success).toBe(true);
    // CONTROL: the mirror is not simply accepting everything — a declared key
    // with the wrong VALUE type is refused.
    expect(ObjectTreeMirror.safeParse({ ...base, parentField: 42 }).success).toBe(false);
    expect(ObjectTreeMirror.safeParse(base).success).toBe(true);
  });
});
