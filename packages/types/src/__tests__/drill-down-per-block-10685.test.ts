/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Each drill block refuses, by name, the `DrillDownConfig` members it can
 * never honour (objectui#10685, applying objectui#9002's ruling B, a per-block
 * refusal, to the sibling blocks of `object-metric`, whose pin is
 * `object-metric-drill-down-config-9002.test.ts`).
 *
 * One `describe` per block. Each refuses its members one per line, so each
 * `@ts-expect-error` owns exactly one error, and each carries a control that
 * compiles: the members the block DOES read.
 *
 *  - `object-pivot`: `mode`. Every pivot click point is an aggregated bucket,
 *    so the pivot always drills through; there is no row to open as a record.
 *  - `object-chart`: `mode` and `report`. Its drill shape is the spec's
 *    `ChartDrillDown`, the chart subset that declares neither (bound by
 *    objectui#8885, whose pin holds that binding with `Equal`). A chart segment
 *    is an aggregated bucket too, and the chart's own drawer renders a record
 *    list, never a report. This half was already refused before this card, by
 *    omission from the spec type; it is pinned here so each block's refused
 *    set sits in one place.
 *
 * ## These assertions are compile-time only
 *
 * Judged by `tsc -p tsconfig.test.json`, the third leg of this package's
 * `type-check` script. Vitest strips types, so the `expect` at the bottom only
 * keeps each block a collected suite. A `@ts-expect-error` line whose error
 * disappears is itself an error (TS2578), which is what lets each refusal fail.
 */

import { describe, it, expect } from 'vitest';
// The per-block shapes through the module the published
// `@object-ui/types/data-display` subpath serves; the chart through the barrel.
import type { DrillDownConfig, ObjectPivotDrillDownConfig } from '../data-display';
import type { ObjectChartSchema } from '../index';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type IsAny<T> = 0 extends 1 & T ? true : false;

describe('object-pivot refuses drillDown.mode (objectui#10685)', () => {
  it('is pinned at compile time', () => {
    // Keeps the refusals below from passing vacuously: an `any` shape would
    // accept `mode` and leave each `@ts-expect-error` unused for the wrong reason.
    type _PivotShapeIsReal = Assert<Equal<IsAny<ObjectPivotDrillDownConfig>, false>>;

    // @ts-expect-error `mode` is refused on `object-pivot` (objectui#10685).
    const withMode: ObjectPivotDrillDownConfig = { enabled: true, mode: 'filter' };
    const shared: DrillDownConfig = { enabled: true, mode: 'record' };
    // @ts-expect-error a shared config that may carry `mode` is not a pivot drill config.
    const handedAcross: ObjectPivotDrillDownConfig = shared;

    // Control: every member the pivot reads still compiles, `report` included.
    const live: ObjectPivotDrillDownConfig = {
      enabled: true,
      filter: { stage: '${event.rowKey}' },
      title: '${event.rowLabel} × ${event.colLabel}',
      target: 'navigate',
      columns: ['name', 'amount'],
      maxRows: 25,
      report: { name: 'won_deals_by_owner' },
    };
    // Still a `DrillDownConfig`, so `computeDrillFilter` and friends take it.
    const liveAsShared: DrillDownConfig = live;

    // Control: the shared type keeps `mode` for `object-data-table`.
    const table: DrillDownConfig = { enabled: true, mode: 'record' };

    expect([withMode, handedAcross, liveAsShared, table]).toHaveLength(4);
  });
});

describe('object-chart refuses drillDown.mode and drillDown.report (objectui#10685)', () => {
  it('is pinned at compile time', () => {
    type _ChartDrillIsReal = Assert<Equal<IsAny<NonNullable<ObjectChartSchema['drillDown']>>, false>>;

    const base = { type: 'object-chart', chartType: 'bar', objectName: 'opportunity' } as const;

    // @ts-expect-error `mode` is not a chart drill member: a segment always drills through.
    const withMode: ObjectChartSchema = { ...base, drillDown: { enabled: true, mode: 'record' } };
    // @ts-expect-error `report` is not a chart drill member: the chart's drawer lists records.
    const withReport: ObjectChartSchema = { ...base, drillDown: { enabled: true, report: { name: 'pipeline' } } };

    // Control: every member the chart reads still compiles.
    const live: ObjectChartSchema = {
      ...base,
      drillDown: {
        enabled: true,
        filter: { stage: '${event.category}' },
        title: '${event.category}',
        target: 'navigate',
        columns: ['name', 'amount'],
        maxRows: 50,
      },
    };

    expect([withMode, withReport, live]).toHaveLength(3);
  });
});
