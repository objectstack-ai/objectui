/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * objectui#6152 round 10 — three flat members follow their `@objectstack/spec` rows by
 * reference, on both faces of this package.
 *
 *   - `ObjectGridSchema.defaultFilters` is the `object-grid` row's own member: the SAME
 *     `ViewFilterRule` array as `filter`, which the row has declared since 17.6.0. It was
 *     `Record<string, any>` / `z.record(z.string(), z.any())`, so the MongoDB-style record
 *     the row refuses type-checked and parsed here, and the rule array the row takes was
 *     REFUSED by the mirror. The flat grid mirror is not an authoring arm
 *     (objectui#11276), but it is the source of the `object-view` `table` slot, so
 *     `table.defaultFilters` — objectui's own door — moves with it.
 *   - `ObjectGanttSchema.filter` / `ObjectMapSchema.filter` are their rows' own member,
 *     the `ViewFilterRule` array. They were `any[]` / `z.array(z.any())`. Their authored
 *     arms are the rows themselves (the `properties` bag), so no authored door moves.
 *
 * The first block re-reads the precondition against the INSTALLED spec, and the
 * differential blocks hold every local verdict to the row's on the same values: the local
 * faces must never refuse what the installed protocol accepts, nor accept what it refuses.
 * `filter` on the grid is the lit control throughout: round 8 moved it, this round does not.
 */
import { describe, it, expect } from 'vitest';

import {
  ObjectGanttPropsSchema as SpecObjectGanttPropsSchema,
  ObjectGridPropsSchema as SpecObjectGridPropsSchema,
  ObjectMapPropsSchema as SpecObjectMapPropsSchema,
} from '@objectstack/spec/ui';
import type {
  ObjectGanttProps as SpecObjectGanttProps,
  ObjectGridProps as SpecObjectGridProps,
  ObjectMapProps as SpecObjectMapProps,
  ViewFilterRule,
} from '@objectstack/spec/ui';
import type {
  ObjectGanttSchema as TsObjectGanttSchema,
  ObjectGridSchema as TsObjectGridSchema,
  ObjectMapSchema as TsObjectMapSchema,
  ObjectViewSchema as TsObjectViewSchema,
} from '../objectql';
import { ObjectGanttSchema, ObjectGridSchema, ObjectMapSchema, ObjectViewSchema } from '../zod/objectql.zod.js';
import { AnyComponentSchema, StrictAnyComponentSchema, safeValidateSchema } from '../zod/index.zod.js';

type Issue = { code: string; path: PropertyKey[]; message: string };
type Parsed = { success: boolean; error?: { issues: readonly Issue[] } };
type Parse = (doc: unknown) => Parsed;

const codeAndPath = (r: Parsed) => (r.success ? [] : r.error!.issues.map((i) => ({ code: i.code, path: i.path })));
const paths = (r: Parsed) => (r.success ? [] : r.error!.issues.map((i) => i.path.join('.')));
const firstMessage = (r: Parsed) => (r.success ? '' : r.error!.issues[0].message);

const GRID = { type: 'object-grid', objectName: 'task' };
const GANTT = { type: 'object-gantt', objectName: 'task' };
const MAP = { type: 'object-map', objectName: 'site' };
const VIEW = { type: 'object-view', objectName: 'task' };

const RULES: ViewFilterRule[] = [{ field: 'status', operator: 'equals', value: 'open' }];
const TUPLES = [['status', '=', 'open']];
const RECORD = { status: 'open' };

const DOORS: ReadonlyArray<readonly [string, Parse]> = [
  ['the tolerant face', (d) => AnyComponentSchema.safeParse(d)],
  ['the strict face', (d) => StrictAnyComponentSchema.safeParse(d)],
  ['safeValidateSchema', (d) => safeValidateSchema(d)],
];

/** The values every differential below is read over: both verdicts occur (asserted). */
const VALUES: ReadonlyArray<readonly [string, unknown]> = [
  ['the rule array', RULES],
  ['an empty array', []],
  ['the tuple array', TUPLES],
  ['an AST `and` node', ['and', ['status', '=', 'open'], ['amount', '>', 100]]],
  ['the record', RECORD],
  ['an empty record', {}],
  ['a string clause', 'status = open'],
  ['a rule with an unknown operator', [{ field: 'status', operator: '=', value: 'open' }]],
];

/* ── The precondition, on the installed protocol ─────────────────────────────── */

describe('objectui#6152 round 10 — the installed protocol (the precondition)', () => {
  it('the `object-grid` row takes the rule array on `defaultFilters` and refuses the record, naming the rule array', () => {
    expect(SpecObjectGridPropsSchema.safeParse({ defaultFilters: RULES }).success).toBe(true);
    const record = SpecObjectGridPropsSchema.safeParse({ defaultFilters: RECORD });
    expect(codeAndPath(record)).toEqual([{ code: 'invalid_type', path: ['defaultFilters'] }]);
    // The refusal names the new shape, computed from the author's own keys.
    expect(firstMessage(record)).toContain("[{ field: 'status', operator: 'equals', value: 'open' }]");
    expect(paths(SpecObjectGridPropsSchema.safeParse({ defaultFilters: TUPLES }))).toEqual(['defaultFilters.0']);
  });

  it.each([
    ['object-gantt', SpecObjectGanttPropsSchema],
    ['object-map', SpecObjectMapPropsSchema],
  ] as const)('the `%s` row takes the rule array on `filter` and refuses the tuple array and the record', (_type, row) => {
    expect(row.safeParse({ filter: RULES }).success).toBe(true);
    expect(paths(row.safeParse({ filter: TUPLES }))).toEqual(['filter.0']);
    const record = row.safeParse({ filter: RECORD });
    expect(paths(record)).toEqual(['filter']);
    expect(firstMessage(record)).toContain("[{ field: 'status', operator: 'equals', value: 'open' }]");
  });
});

/* ── The members ARE the rows' ───────────────────────────────────────────────── */

describe('objectui#6152 round 10 — the mirror members are the rows\' own, by reference', () => {
  it('`ObjectGridSchema.defaultFilters` is the row\'s member (identity, not a copy)', () => {
    expect(ObjectGridSchema.shape.defaultFilters).toBe(SpecObjectGridPropsSchema.shape.defaultFilters);
    // CONTROL — the identity check can fail: the row's `defaultFilters` is not its `filter`.
    expect(ObjectGridSchema.shape.defaultFilters).not.toBe(SpecObjectGridPropsSchema.shape.filter);
    // Lit control: round 8's `filter` is still the row's own `filter`.
    expect(ObjectGridSchema.shape.filter).toBe(SpecObjectGridPropsSchema.shape.filter);
  });

  it('the flat gantt and map `filter` are their rows\' members', () => {
    expect(ObjectGanttSchema.shape.filter).toBe(SpecObjectGanttPropsSchema.shape.filter);
    expect(ObjectMapSchema.shape.filter).toBe(SpecObjectMapPropsSchema.shape.filter);
    // CONTROL — the gantt row's member is not the map row's.
    expect(ObjectGanttSchema.shape.filter).not.toBe(SpecObjectMapPropsSchema.shape.filter);
  });
});

/* ── Every local verdict is the row's ────────────────────────────────────────── */

describe('objectui#6152 round 10 — every flat mirror verdict is its row\'s', () => {
  describe.each([
    ['object-grid `defaultFilters`', ObjectGridSchema as unknown as { safeParse: Parse }, SpecObjectGridPropsSchema, GRID, 'defaultFilters'],
    ['object-grid `filter` (lit control, round 8)', ObjectGridSchema as unknown as { safeParse: Parse }, SpecObjectGridPropsSchema, GRID, 'filter'],
    ['object-gantt `filter`', ObjectGanttSchema as unknown as { safeParse: Parse }, SpecObjectGanttPropsSchema, GANTT, 'filter'],
    ['object-map `filter`', ObjectMapSchema as unknown as { safeParse: Parse }, SpecObjectMapPropsSchema, MAP, 'filter'],
  ] as const)('%s', (_label, mirror, row, node, key) => {
    it('CONTROL: the node without the key parses', () => {
      const r = mirror.safeParse(node);
      expect(r.success, JSON.stringify(codeAndPath(r))).toBe(true);
    });

    it.each(VALUES)('%s: the mirror and the installed row agree', (_value, value) => {
      const local = mirror.safeParse({ ...node, [key]: value });
      const upstream = row.safeParse({ [key]: value });
      expect(local.success).toBe(upstream.success);
      if (!local.success) expect(paths(local).every((p) => p.startsWith(key))).toBe(true);
    });

    it('both verdicts occur, so the agreement above is a reading', () => {
      const verdicts = VALUES.map(([, value]) => row.safeParse({ [key]: value }).success);
      expect(verdicts).toContain(true);
      expect(verdicts).toContain(false);
    });
  });
});

/* ── The `object-view` `table` slot: objectui's own door ─────────────────────── */

describe('objectui#6152 round 10 — `table.defaultFilters` takes the rule array and refuses the record', () => {
  describe.each(DOORS)('%s', (_door, parse) => {
    it('the rule array parses', () => {
      const r = parse({ ...VIEW, table: { defaultFilters: RULES } });
      expect(r.success, JSON.stringify(codeAndPath(r))).toBe(true);
    });

    it('the record is refused AT `table.defaultFilters`, naming the rule array', () => {
      const r = parse({ ...VIEW, table: { defaultFilters: RECORD } });
      expect(codeAndPath(r)).toEqual([{ code: 'invalid_type', path: ['table', 'defaultFilters'] }]);
      expect(firstMessage(r)).toContain("[{ field: 'status', operator: 'equals', value: 'open' }]");
    });

    it('the tuple array is refused at its first element', () => {
      expect(paths(parse({ ...VIEW, table: { defaultFilters: TUPLES } }))).toEqual(['table.defaultFilters.0']);
    });

    it('LIT CONTROL: `table.filter` is unchanged — the rule array parses, the tuple array is refused', () => {
      expect(parse({ ...VIEW, table: { filter: RULES } }).success).toBe(true);
      expect(paths(parse({ ...VIEW, table: { filter: TUPLES } }))).toEqual(['table.filter.0']);
    });

    it.each(VALUES)('%s: the slot\'s verdict is the row\'s', (_value, value) => {
      const local = parse({ ...VIEW, table: { defaultFilters: value } });
      expect(local.success).toBe(SpecObjectGridPropsSchema.safeParse({ defaultFilters: value }).success);
    });
  });

  it('the `object-view` mirror\'s own slot agrees with the doors above', () => {
    expect(ObjectViewSchema.safeParse({ ...VIEW, table: { defaultFilters: RULES } }).success).toBe(true);
    expect(codeAndPath(ObjectViewSchema.safeParse({ ...VIEW, table: { defaultFilters: RECORD } })))
      .toEqual([{ code: 'invalid_type', path: ['table', 'defaultFilters'] }]);
  });

  it('CONTROL: the authored `object-grid` node\'s bag (the row itself) gives the same verdicts', () => {
    for (const [, parse] of DOORS) {
      const ok = parse({ type: 'object-grid', properties: { objectName: 'task', defaultFilters: RULES } });
      expect(ok.success, JSON.stringify(codeAndPath(ok))).toBe(true);
      expect(paths(parse({ type: 'object-grid', properties: { objectName: 'task', defaultFilters: RECORD } })))
        .toEqual(['properties.defaultFilters']);
    }
  });
});

/* ── The TypeScript face ─────────────────────────────────────────────────────── */

describe('objectui#6152 round 10 — the TypeScript face', () => {
  it('the record `defaultFilters` and the tuple / record gantt and map `filter` are `tsc` errors; the rule array type-checks', () => {
    // Real directives: this package type-checks its tests (`tsconfig.test.json`), so a
    // re-widened member fails on the unused directive.
    // @ts-expect-error `defaultFilters` is the `ViewFilterRule` array, not the record form
    const gridRecord: TsObjectGridSchema = { type: 'object-grid', objectName: 'task', defaultFilters: { status: 'open' } };
    // @ts-expect-error the `table` slot's `defaultFilters` is the grid's: the record is refused there too
    const slotRecord: TsObjectViewSchema = { type: 'object-view', objectName: 'task', table: { defaultFilters: { status: 'open' } } };
    // @ts-expect-error `filter` is the `ViewFilterRule` array, not the AST tuple array
    const ganttTuples: TsObjectGanttSchema = { type: 'object-gantt', objectName: 'task', filter: [['status', '=', 'open']] };
    // @ts-expect-error `filter` is the `ViewFilterRule` array, not the record form
    const mapRecord: TsObjectMapSchema = { type: 'object-map', objectName: 'site', filter: { status: 'open' } };
    // @ts-expect-error `filter` is the `ViewFilterRule` array, not the AST tuple array
    const mapTuples: TsObjectMapSchema = { type: 'object-map', objectName: 'site', filter: [['status', '=', 'open']] };
    // Lit controls on the same faces.
    const grid: TsObjectGridSchema = { type: 'object-grid', objectName: 'task', defaultFilters: RULES };
    const slot: TsObjectViewSchema = { type: 'object-view', objectName: 'task', table: { defaultFilters: RULES } };
    const gantt: TsObjectGanttSchema = { type: 'object-gantt', objectName: 'task', filter: RULES };
    const map: TsObjectMapSchema = { type: 'object-map', objectName: 'site', filter: RULES };
    expect([gridRecord, slotRecord, ganttTuples, mapRecord, mapTuples]).toHaveLength(5);
    expect([grid.defaultFilters, slot.table?.defaultFilters, gantt.filter, map.filter]).toEqual([RULES, RULES, RULES, RULES]);
  });
});

/* Read off the members: each is the row's own type. */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

export type assertionRound10MembersAreTheRows = [
  Expect<Equal<TsObjectGridSchema['defaultFilters'], SpecObjectGridProps['defaultFilters']>>,
  Expect<Equal<TsObjectGridSchema['defaultFilters'], ViewFilterRule[] | undefined>>,
  Expect<Equal<NonNullable<TsObjectViewSchema['table']>['defaultFilters'], ViewFilterRule[] | undefined>>,
  Expect<Equal<TsObjectGanttSchema['filter'], SpecObjectGanttProps['filter']>>,
  Expect<Equal<TsObjectMapSchema['filter'], SpecObjectMapProps['filter']>>,
  Expect<Equal<TsObjectGanttSchema['filter'], ViewFilterRule[] | undefined>>,
  Expect<Equal<TsObjectMapSchema['filter'], ViewFilterRule[] | undefined>>,
  // Lit control: round 8's grid `filter` is unchanged.
  Expect<Equal<TsObjectGridSchema['filter'], SpecObjectGridProps['filter']>>,
];
