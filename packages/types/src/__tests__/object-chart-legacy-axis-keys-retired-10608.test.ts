/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Retirement pin — `ObjectChartSchema.xAxisField` / `yAxisFields` /
 * `aggregation` are REFUSED on the `object-chart` node, each by name with the
 * spec spelling as its remedy (objectui#10608, ADR-0049 enforce-or-remove).
 *
 * ## The failure this pin exists to prevent
 *
 * The three are the LIST-VIEW chart block's vocabulary. The list-view relays
 * translate that block into `aggregate` / `xAxisKey` / `series` before they
 * compose an `object-chart` node, and nothing on the node's own render path
 * reads them — so both published faces declared three keys that type-checked,
 * parsed green through `objectui validate`, and drew no category axis and no
 * series. An author (or an AI author reading the `.d.ts`) had every signal that
 * `xAxisField: 'status'` was the way to bind the axis, and got an empty chart.
 * The render reading and the producer census are recorded on the card's PR, as
 * a one-time measurement; this file is the instrument that keeps the contract.
 *
 * ## Why tombstones and not deletions
 *
 * `BaseSchema` is `.passthrough()` on the zod side and carries an index
 * signature on the TS side, so an UNDECLARED key is not refused, it is KEPT.
 * Deleting the three members would hand the authored spelling exactly the
 * silent no-op this card closes; block (d) pins that consequence on a
 * misspelling, so the reason is a reading and not prose. `?: never` +
 * `retirementTombstone()` is this package's convention — the precedent this
 * follows most closely is `ChatbotSchema.userAvatar` / `height`
 * (`chatbot-dark-keys-retired-7703.test.ts`): a dead spelling beside a live
 * one, refused with the live one as the remedy.
 *
 * ## How refusals are asserted
 *
 * By the issue ENVELOPE — `code` and `path`, and that it is the ONLY issue, so
 * a refusal cannot ride on some other failure of the same document — at the
 * public door `safeValidateSchema` (what `objectui validate` / `objectui check`
 * run) and on the mirror. The message is asserted to carry the remedy's own
 * spelling, which IS the contract here (triage's execution note: tombstones
 * naming the spec spelling); nothing else of its wording is pinned.
 *
 * ## The lit controls
 *
 * Block (b): the spec spelling of the same intent parses on the same node, at
 * the same door. Block (e): the LIST-VIEW carrier that does read these names
 * (the `options.chart` bag) still accepts them — the retirement is scoped to
 * this node, and that boundary is pinned rather than stated.
 *
 * The `@ts-expect-error` directives in block (f) are REAL enforcement: this
 * package type-checks its tests through `tsconfig.test.json`, so re-widening a
 * member fails the build on the unused directive (TS2578). A green `vitest`
 * run is NOT evidence about them — type assertions are erased before it runs.
 */

import { describe, it, expect } from 'vitest';
import { ChartAggregateSchema as SpecChartAggregateSchema } from '@objectstack/spec/ui';
import type { ObjectChartSchema } from '../objectql';
import { ObjectChartSchema as ObjectChartMirror } from '../zod/objectql.zod';
import { ListViewSchema, safeValidateSchema } from '../zod/index.zod';

const CHART = { type: 'object-chart', chartType: 'bar' } as const;
const chart = (extra: Record<string, unknown>) => ({ ...CHART, ...extra });

/**
 * The retired keys, each with the values an author would plausibly have written
 * (every arm of the retired declaration, so a partial re-widening shows up) and
 * the remedy's own spelling, which the refusal must carry.
 */
const RETIRED = {
  xAxisField: {
    values: ['status'],
    remedy: "xAxis: { field: 'status' }",
  },
  yAxisFields: {
    values: [['amount'], ['amount', 'count']],
    remedy: "yAxis: [{ field: 'amount' }]",
  },
  aggregation: {
    values: ['cardinality', 'sum', 'avg', 'min', 'max'],
    remedy: 'aggregate: { field, function, groupBy }',
  },
} as const;

type RetiredKey = keyof typeof RETIRED;
const RETIRED_KEYS = Object.keys(RETIRED) as RetiredKey[];

type Issue = { code: string; path: PropertyKey[]; message: string };
const issuesOf = (r: { success: boolean; error?: { issues: Issue[] } }): Issue[] => r.error?.issues ?? [];

const mirrorShape = (ObjectChartMirror as unknown as { shape: Record<string, { description?: string }> }).shape;

/* ── (a) each key is refused by name, with the spec spelling as the remedy ── */

describe.each(RETIRED_KEYS)('objectui#10608 (a) — `%s` is RETIRED on `object-chart`', (key) => {
  const { values, remedy } = RETIRED[key];

  it.each(values.map((v) => [JSON.stringify(v), v] as const))(
    'refuses `%s` at the public door and on the mirror: ONE `invalid_type` issue at the key, naming the remedy',
    (_label, value) => {
      for (const r of [safeValidateSchema(chart({ [key]: value })), ObjectChartMirror.safeParse(chart({ [key]: value }))]) {
        expect(r.success, `an authored \`${key}: ${JSON.stringify(value)}\` was ACCEPTED`).toBe(false);
        const issues = issuesOf(r);
        expect(issues.map(({ code, path }) => ({ code, path }))).toEqual([{ code: 'invalid_type', path: [key] }]);
        expect(issues[0]!.message).toContain(`\`${key}\``);
        expect(issues[0]!.message).toContain(remedy);
      }
    },
  );

  it('the refusal message and the published `.describe()` metadata are ONE string', () => {
    const r = ObjectChartMirror.safeParse(chart({ [key]: values[0] }));
    expect(issuesOf(r)[0]!.message).toBe(mirrorShape[key]!.description);
  });

  it('stays DECLARED on the mirror — a tombstone, not a deletion (see block d)', () => {
    expect(Object.keys(mirrorShape)).toContain(key);
  });
});

/* ── (b) LIT CONTROL: the spec spelling of the same intent parses ─────────── */

describe('objectui#10608 (b) — LIT CONTROL: each remedy parses on the same node, at the same door', () => {
  it.each([
    ['`xAxis: { field }` for `xAxisField`', { xAxis: { field: 'status' } }],
    ['`yAxis: [{ field }]` for `yAxisFields`', { yAxis: [{ field: 'amount' }] }],
    ['`aggregate: { field, function, groupBy }` for `aggregation`', { objectName: 'task', aggregate: { field: 'amount', function: 'sum', groupBy: 'status' } }],
  ])('%s', (_label, extra) => {
    expect(issuesOf(safeValidateSchema(chart(extra)))).toEqual([]);
    expect(issuesOf(ObjectChartMirror.safeParse(chart(extra)))).toEqual([]);
  });

  it('all three remedies together, on one node', () => {
    const node = chart({
      objectName: 'task',
      aggregate: { field: 'amount', function: 'sum', groupBy: 'status' },
      xAxis: { field: 'status' },
      yAxis: [{ field: 'amount' }],
    });
    expect(safeValidateSchema(node).success).toBe(true);
  });
});

/* ── (c) the `aggregation` remedy's vocabulary is the spec's, read live ───── */

describe('objectui#10608 (c) — the `function` vocabulary the `aggregation` refusal lists is the spec\'s own', () => {
  it('equals `ChartAggregateSchema.shape.function`\'s options, read off the installed spec', () => {
    const message = mirrorShape.aggregation!.description!;
    const listed = message.slice(message.indexOf('`function` one of')).split(';')[0]!.match(/`([a-z_]+)`/g)!
      .map((t) => t.slice(1, -1))
      .filter((t) => t !== 'function');
    const specFns = (SpecChartAggregateSchema.shape.function as unknown as { options: string[] }).options;
    expect(listed.length).toBeGreaterThan(0);
    expect([...listed].sort()).toEqual([...specFns].sort());
  });
});

/* ── (d) why a tombstone: an undeclared key would be KEPT, not refused ────── */

describe('objectui#10608 (d) — CONTROL: an undeclared spelling is KEPT by `.passthrough()`', () => {
  it('a misspelled `xAxisFeld` parses green and survives the parse — what a deletion would have left', () => {
    const r = ObjectChartMirror.safeParse(chart({ xAxisFeld: 'status' }));
    expect(r.success).toBe(true);
    expect((r.data as Record<string, unknown>).xAxisFeld).toBe('status');
  });
});

/* ── (e) the boundary: the LIST-VIEW carrier keeps these names ────────────── */

describe('objectui#10608 (e) — CONTROL: the list-view carrier still takes these names', () => {
  /*
   * The carrier the authoring door still admits them on is the legacy
   * `options.chart` bag — the one `resolveListChartBinding` reads beside
   * `chart` and translates before it composes an `object-chart` node. (The
   * spec's own `chart` block is dataset-only and refuses them already; that is
   * the spec's ruling, not this card's, and is not pinned here.)
   */
  it('a `chart` list view authoring `xAxisField` / `yAxisFields` / `aggregation` in `options.chart` parses, on both doors', () => {
    const view = {
      type: 'list-view',
      objectName: 'task',
      columns: ['name'],
      viewType: 'chart',
      options: { chart: { chartType: 'bar', xAxisField: 'status', yAxisFields: ['estimate'], aggregation: 'sum' } },
    };
    expect(issuesOf(ListViewSchema.safeParse(view))).toEqual([]);
    expect(issuesOf(safeValidateSchema(view))).toEqual([]);
  });
});

/* ── (f) the TS twin carries the same contract ───────────────────────────── */

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

/** `Equal`, not `extends`: an UNDECLARED member reads `any` through the index signature. */
export type assertionXAxisFieldRetired = Expect<Equal<ObjectChartSchema['xAxisField'], undefined>>;
export type assertionYAxisFieldsRetired = Expect<Equal<ObjectChartSchema['yAxisFields'], undefined>>;
export type assertionAggregationRetired = Expect<Equal<ObjectChartSchema['aggregation'], undefined>>;
/** The helper can FAIL — synthetic control (an undeclared key reads `any`). */
export type assertionEqualCanFail = Expect<Equal<Equal<ObjectChartSchema['xAxisFeld'], undefined>, false>>;

describe('objectui#10608 (f) — the TS twin refuses what the mirror refuses', () => {
  it('each retired key is a compile error — checked by `tsc -p tsconfig.test.json`', () => {
    // Not `as const`: a readonly literal would fail every line below for a
    // reason of its own, and each `@ts-expect-error` would pass without testing.
    const base = { type: 'object-chart' as const, chartType: 'bar' as const };
    const refused: ObjectChartSchema[] = [
      // @ts-expect-error — retired: write `xAxis: { field }`
      { ...base, xAxisField: 'status' },
      // @ts-expect-error — retired: write `yAxis: [{ field }]`
      { ...base, yAxisFields: ['amount'] },
      // @ts-expect-error — retired: write `aggregate: { field, function, groupBy }`
      { ...base, aggregation: 'sum' },
    ];
    expect(refused).toHaveLength(3);
  });

  it('CONTROL — the spec spelling compiles on the same node', () => {
    const node: ObjectChartSchema = {
      type: 'object-chart',
      chartType: 'bar',
      objectName: 'task',
      aggregate: { field: 'amount', function: 'sum', groupBy: 'status' },
      xAxis: { field: 'status' },
      yAxis: [{ field: 'amount' }],
    };
    expect(node.xAxis?.field).toBe('status');
  });
});
