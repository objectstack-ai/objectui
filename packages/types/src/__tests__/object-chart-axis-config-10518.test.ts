/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10518 — `ObjectChartSchema.yAxis` DECLARES the spec's axis config
 * LIST (ruling 5809510046, branch 2 — declare), the `object-chart` sibling of
 * objectui#7690, whose pin for the `chart` node is
 * `chart-axis-config-7690.test.ts`.
 *
 * ## The protocol answered first
 *
 * `@objectstack/spec/ui` declares the key on this very node: the `REACT_BLOCKS`
 * entry for `<ObjectChart>` carries `schemaType: 'object-chart'` and
 * `schema: ChartConfigSchema`, and lists `yAxis` among its `dataProps`;
 * `ChartConfigSchema.yAxis` is an ARRAY of `ChartAxisSchema`. Block (a) reads
 * both off the installed spec rather than writing them down here.
 *
 * ## The defect (measured on the branch point before the change)
 *
 * The key was declared on neither face, so it rode `BaseSchema`'s
 * `.passthrough()` — KEPT, read by the renderer, and UNCHECKED:
 * `yAxis: [{ field: 'n', stepSize: 'big' }]`, an entry carrying `logScale`,
 * and a single axis object all parsed green. The shape pin in (a) and every
 * refusal in (c) and (d) are red on that tree; the PR records the run.
 *
 * ## The lit control is the real producer
 *
 * The objectstack showcase command-center page builds its dataset-bound charts
 * through one helper that writes `yAxis: [{ field: values[0], stepSize: 1 }]`
 * inside the node's `properties` bag. `SchemaRenderer` hoists that bag onto the
 * node, so the node below is the shape the mirror judges — flattened, with the
 * helper's own keys. It parses on the branch point and on this change alike:
 * the declaration narrows nothing that producer writes.
 *
 * ## How refusals are asserted
 *
 * By issue `code` and `path`. Where a message is asserted, it is compared
 * against the SPEC's own message for the same axis, read off the spec schema in
 * the same test — never against a string written here.
 */

import { describe, it, expect } from 'vitest';
import {
  ChartAxisSchema as SpecChartAxisSchema,
  ChartConfigSchema as SpecChartConfigSchema,
  REACT_BLOCKS,
  type ChartAxis as SpecChartAxis,
} from '@objectstack/spec/ui';
import type { ObjectChartSchema } from '../objectql';
import { ObjectChartSchema as ObjectChartMirror } from '../zod/objectql.zod';
import { safeValidateSchema } from '../zod/index.zod';

const CHART = { type: 'object-chart', chartType: 'bar' } as const;
const chart = (extra: Record<string, unknown>) => ({ ...CHART, ...extra });

const parsed = (doc: unknown) => {
  const r = ObjectChartMirror.safeParse(doc);
  if (!r.success) throw new Error(`expected ACCEPT, got: ${JSON.stringify(r.error.issues)}`);
  return r.data as Record<string, unknown>;
};

const issues = (doc: unknown) => {
  const r = ObjectChartMirror.safeParse(doc);
  if (r.success) throw new Error('expected REFUSE, got ACCEPT');
  return r.error.issues;
};

/** The spec's own first message for an axis value, read live off the spec schema. */
const specMessage = (axis: unknown): string => {
  const r = SpecChartAxisSchema.safeParse(axis);
  if (r.success) throw new Error('control: the spec accepts this axis');
  return r.error.issues[0]!.message;
};

const SPEC_AXIS_KEYS = Object.keys(SpecChartAxisSchema.shape).sort();

/** One valid value per spec axis key — a key the spec adds without a sample here fails (a) loudly. */
const FULL_AXIS: Record<string, unknown> = {
  field: 'task_count',
  title: { en: 'Tasks', 'zh-CN': '任务' },
  format: '0,0',
  min: 0,
  max: 100,
  stepSize: 1,
  showGridLines: false,
  position: 'left',
  logarithmic: false,
};

/**
 * The showcase command-center producer's node, flattened as `SchemaRenderer`
 * hoists `properties` — the `chart()` helper with its `integerYAxis` flag on.
 */
const SHOWCASE_NODE = {
  id: 'cc_status_c',
  type: 'object-chart',
  responsiveStyles: { large: { width: '100%', minWidth: '0' } },
  dataset: 'showcase_task_metrics',
  dimensions: ['status'],
  values: ['task_count'],
  chartType: 'bar',
  colors: ['hsl(192 86% 46%)', 'hsl(256 72% 62%)'],
  yAxis: [{ field: 'task_count', stepSize: 1 }],
} as const;

type Shape = Record<string, unknown>;
const mirrorShape = (ObjectChartMirror as unknown as { shape: Shape }).shape;

/* ── Type-level pin (compiled by `tsc -p tsconfig.test.json`) ─────────────── */

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

/**
 * `Equal`, not `extends`: an UNDECLARED member reads `any` through
 * `BaseSchema`'s index signature, and a one-way check accepts `any` — which is
 * precisely the before-state.
 */
export type assertionYAxisIsTheSpecList = Expect<Equal<ObjectChartSchema['yAxis'], SpecChartAxis[] | undefined>>;
/** The helper can FAIL — synthetic control (an undeclared key reads `any`). */
export type assertionEqualCanFail = Expect<Equal<Equal<any, SpecChartAxis[] | undefined>, false>>;

/* ── (a) the declaration IS the spec's ───────────────────────────────────── */

describe('objectui#10518 (a) — `yAxis` is declared, with the spec axis list', () => {
  it('the spec declares `yAxis` on the `object-chart` react block, as `ChartConfigSchema`\'s list', () => {
    const block = REACT_BLOCKS.find((b) => b.schemaType === 'object-chart');
    expect(block, 'no REACT_BLOCKS entry for object-chart in the installed spec').toBeDefined();
    expect(block!.schema).toBe(SpecChartConfigSchema);
    expect(block!.dataProps).toContain('yAxis');
    // The list arm, read off the spec: one entry parses, a bare object is
    // refused AT `yAxis` (the spec's config needs its own `type`, so it is given).
    expect(SpecChartConfigSchema.safeParse({ type: 'bar', yAxis: [{ field: 'n' }] }).success).toBe(true);
    const single = SpecChartConfigSchema.safeParse({ type: 'bar', yAxis: { field: 'n' } });
    expect(single.success).toBe(false);
    expect(single.error!.issues.map((i) => i.path)).toEqual([['yAxis']]);
  });

  it('`yAxis` is in the mirror\'s own shape — declared, not passed through', () => {
    expect(Object.keys(mirrorShape)).toContain('yAxis');
  });

  it('the sample below covers exactly the spec\'s axis keys (read off the installed spec)', () => {
    expect(Object.keys(FULL_AXIS).sort()).toEqual(SPEC_AXIS_KEYS);
  });

  it('every spec axis key is accepted on a `yAxis` entry, and the value survives unchanged', () => {
    const second = { ...FULL_AXIS, position: 'right' };
    expect(parsed(chart({ yAxis: [FULL_AXIS, second] })).yAxis).toEqual([FULL_AXIS, second]);
  });

  /*
   * The spec gives `showGridLines` and `logarithmic` a `.default()`. Referenced
   * raw, a parse would WRITE both into the output. The CONTROL is the spec
   * schema itself, which does inject — so the equality is a reading of
   * `stripImportedDefaults`, not an accident.
   */
  it('omitted keys stay omitted — the spec defaults are not written into the output', () => {
    expect(parsed(chart({ yAxis: [{ field: 'task_count' }] })).yAxis).toEqual([{ field: 'task_count' }]);
  });

  it('CONTROL — the spec schema referenced raw DOES inject its defaults', () => {
    expect(SpecChartAxisSchema.parse({ field: 'task_count' })).toEqual({
      field: 'task_count',
      showGridLines: true,
      logarithmic: false,
    });
  });
});

/* ── (b) the lit control: the real producer ──────────────────────────────── */

describe('objectui#10518 (b) — LIT CONTROL: the showcase producer\'s node parses, unchanged', () => {
  it('on the mirror, with `yAxis` exactly as written', () => {
    expect(parsed(SHOWCASE_NODE).yAxis).toEqual([{ field: 'task_count', stepSize: 1 }]);
  });

  it('through `safeValidateSchema`, the door `objectui validate` / `objectui check` run', () => {
    expect(safeValidateSchema(SHOWCASE_NODE).success).toBe(true);
  });
});

/* ── (c) values and keys are CHECKED now ─────────────────────────────────── */

describe('objectui#10518 (c) — a malformed `yAxis` entry is refused at its own path', () => {
  it.each([
    ['a non-number `stepSize`', { field: 'task_count', stepSize: 'big' }, ['yAxis', 0, 'stepSize'], 'invalid_type'],
    ['a `position` outside the four', { field: 'task_count', position: 'middle' }, ['yAxis', 0, 'position'], 'invalid_value'],
    ['an undeclared key the spec names an alias of (`logScale`)', { field: 'task_count', logScale: true }, ['yAxis', 0], 'unrecognized_keys'],
    ['a missing `field` — the spec requires it', { stepSize: 1 }, ['yAxis', 0, 'field'], 'invalid_type'],
  ])('%s', (_label, axis, path, code) => {
    const [issue] = issues(chart({ yAxis: [axis] }));
    expect(issue!.code).toBe(code);
    expect(issue!.path).toEqual(path);
    expect(issue!.message).toBe(specMessage(axis));
  });

  it('the refusal reaches the public door — `safeValidateSchema` refuses the node', () => {
    expect(safeValidateSchema(chart({ yAxis: [{ field: 'task_count', stepSize: 'big' }] })).success).toBe(false);
  });

  /* CONTROL for every refusal above: the same documents minus the defect parse. */
  it('CONTROL — the same entries, minus the defect, are accepted', () => {
    expect(() => parsed(chart({ yAxis: [{ field: 'task_count', stepSize: 2 }] }))).not.toThrow();
    expect(() => parsed(chart({ yAxis: [{ field: 'task_count', position: 'right', logarithmic: true }] }))).not.toThrow();
    expect(safeValidateSchema(chart({ yAxis: [{ field: 'task_count', stepSize: 2 }] })).success).toBe(true);
  });
});

/* ── (d) `yAxis` is the spec's LIST — the two other shapes the normalizer tolerates are not members ── */

describe('objectui#10518 (d) — `yAxis` is the spec array, and only that', () => {
  it.each([
    ['a single axis object', { field: 'task_count', stepSize: 1 }],
    ['a bare column name', 'task_count'],
  ])('%s is refused at `yAxis` with `invalid_type`', (_label, yAxis) => {
    const [issue] = issues(chart({ yAxis }));
    expect(issue!.code).toBe('invalid_type');
    expect(issue!.path).toEqual(['yAxis']);
  });

  it('CONTROL — the same axis as a one-entry list parses', () => {
    expect(parsed(chart({ yAxis: [{ field: 'task_count', stepSize: 1 }] })).yAxis).toEqual([
      { field: 'task_count', stepSize: 1 },
    ]);
  });
});

/* ── (e) the TS twin carries the same contract ───────────────────────────── */

describe('objectui#10518 (e) — the TS twin types `yAxis` with the spec\'s `ChartAxis[]`', () => {
  it('accepts the spec shape at the authoring site', () => {
    const axis: SpecChartAxis = { field: 'task_count', stepSize: 1, title: { en: 'Tasks', 'zh-CN': '任务' } };
    const node: ObjectChartSchema = {
      type: 'object-chart',
      chartType: 'bar',
      dataset: 'showcase_task_metrics',
      dimensions: ['status'],
      values: ['task_count'],
      yAxis: [axis, { field: 'task_count', position: 'right' }],
    };
    expect(node.yAxis).toHaveLength(2);
  });

  it('refuses what the mirror refuses — checked by `tsc -p tsconfig.test.json`', () => {
    // Not `as const`: a readonly literal would fail every line below for a
    // reason of its own, and each `@ts-expect-error` would pass without testing.
    const base = { type: 'object-chart' as const, chartType: 'bar' as const };
    const refused: ObjectChartSchema[] = [
      // @ts-expect-error — `yAxis` is the spec's LIST, not a single axis object
      { ...base, yAxis: { field: 'task_count' } },
      // @ts-expect-error — `yAxis` is the spec's LIST, not a bare column name
      { ...base, yAxis: 'task_count' },
      // @ts-expect-error — `stepSize` is a number
      { ...base, yAxis: [{ field: 'task_count', stepSize: 'big' }] },
      // @ts-expect-error — `field` is required on a spec axis object
      { ...base, yAxis: [{ stepSize: 1 }] },
    ];
    expect(refused).toHaveLength(4);
  });
});
