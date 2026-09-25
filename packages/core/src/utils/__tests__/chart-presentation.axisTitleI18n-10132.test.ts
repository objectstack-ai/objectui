/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10132, half 2 — the SEAM half.
 *
 * `ChartAxisSchema.title` is `I18nLabel`, so `{ en: 'Revenue', 'zh-CN': '收入' }`
 * parses, builds and validates. `axisPresentation` collapsed it with
 * `labelText` — a first-string-in-KEY-ORDER pick — so the axis title was
 * decided by the order the author happened to type the map in, and the
 * VIEWER's language never entered the decision. Measured on the reported
 * surface: the same map rendered English to a `zh-CN` viewer and Chinese to an
 * `en` viewer, depending only on which key came first.
 *
 * ## The fix is the neighbour's, not a new one
 *
 * `forwardedI18nLabel` in the same module already carries a chart's
 * `title` / `subtitle` / `description` through unresolved (objectui#9038), for
 * the reason stated there: `@object-ui/core` is React-free, holds no provider,
 * and cannot know the viewer — while `normalizeChartSchema` downstream ALREADY
 * resolves an axis title through `pickLocalized` against the language
 * `ChartRenderer` reads. So the map only has to survive the lowering to reach a
 * resolver that was there all along. This is a bypass, not a missing resolver.
 *
 * ⚠️ This moves one entry of the objectui#4020 ledger that
 * `chart-presentation.i18nLabel-9038.test.ts` pinned as deliberately picked.
 * That ledger's justification is "a locale-unaware CHOICE a caller can
 * OVERRIDE" — and it holds for a series `label`, which `DatasetWidget`
 * overrides from the locale bundle. Nothing overrides an axis title: it is
 * spread onto the chart schema and drawn. The series half therefore stays
 * picked and is re-pinned below, so the asymmetry stays visible.
 *
 * ## What this file pins, and what it deliberately does not
 *
 * The seam only: the authored union survives the lowering. It cannot pin which
 * limb a viewer sees — that is `pickLocalized`'s decision, downstream. The
 * rendered half is `ChartRenderer.axisTitleLocale-10132.test.tsx` in
 * `@object-ui/plugin-charts`, which draws the same map at two languages.
 *
 * ## The key-order control
 *
 * Every map below is written **`en` first**, so a `zh-CN` expectation cannot be
 * satisfied by the first-string pick this replaces.
 *
 * PREDICTIONS, written before the run: the forwarding cases are RED (the
 * lowering hands back the string `'Revenue'`, not the map); the plain-string,
 * refusal, untouched-key and series-label cases are GREEN on both sides.
 */

import { describe, it, expect } from 'vitest';
import {
  axisPresentation,
  mergeAuthoredPresentation,
  seriesPresentation,
} from '../chart-presentation';

/** ⚠️ `en` FIRST — see the key-order control above. */
const MAP = { en: 'Revenue', 'zh-CN': '收入' };

describe('axisPresentation — an inline-locale-map axis title survives the lowering (objectui#10132)', () => {
  it('forwards a locale-map `title` verbatim, for the renderer to resolve', () => {
    // Identity, not equality: the authored value travels untouched, so no
    // renderer-side coercion can have happened on the way through.
    expect(axisPresentation({ field: 'total', title: MAP }).title).toBe(MAP);
  });

  it('leaves a plain-string `title` exactly as it was — the live control', () => {
    // The arm that already worked. It is in this run so that "the map arm now
    // travels" cannot be bought by changing what a string does.
    expect(axisPresentation({ field: 'total', title: 'Revenue' }).title).toBe('Revenue');
  });

  it('still refuses every value the union does not admit', () => {
    for (const value of [42, true, ['Revenue'], '', {}, { en: '' }, { en: 42 }, null, undefined]) {
      const out = axisPresentation({ field: 'total', title: value });
      expect(Object.prototype.hasOwnProperty.call(out, 'title')).toBe(false);
    }
  });

  it('admits a map on the strength of one usable entry and carries the rest as authored', () => {
    // `InlineLocaleMapSchema` is `z.record(<tag>, z.string())`; enforcing that
    // belongs at the parse, not in a renderer-side coercion (AGENTS.md #0.1).
    const mixed = { en: 'Revenue', 'zh-CN': 7 };
    expect(axisPresentation({ field: 'total', title: mixed }).title).toBe(mixed);
  });

  it('changes no other key on the same axis', () => {
    // The harm this must not cause: a key other than `title` moving.
    const axis = {
      field: 'total',
      format: 'currency',
      min: 0,
      max: 100,
      stepSize: 10,
      showGridLines: false,
      position: 'right',
      logarithmic: true,
      title: MAP,
    };
    const withMap = axisPresentation(axis);
    const withString = axisPresentation({ ...axis, title: 'Revenue' });
    for (const [k, v] of Object.entries(withString)) {
      if (k === 'title') continue;
      expect(withMap[k]).toEqual(v);
    }
    expect(Object.keys(withMap).sort()).toEqual(Object.keys(withString).sort());
  });

  it('forwards through the entry point a dataset-bound surface calls, on BOTH axes', () => {
    // `mergeAuthoredPresentation` is what `DatasetWidget` calls; reading
    // `axisPresentation` alone would pin a function no surface reaches directly.
    const { axes } = mergeAuthoredPresentation([{ dataKey: 'total', label: 'Total' }] as never, {
      xAxis: { field: 'status', title: MAP },
      yAxis: [{ field: 'total', title: MAP }],
    });

    expect((axes.xAxis as Record<string, unknown>).title).toBe(MAP);
    expect((axes.yAxis as Array<Record<string, unknown>>)[0].title).toBe(MAP);
  });

  it('leaves the series label PICKED, not forwarded — the ledgered neighbour', () => {
    // objectui#4020's first-string-wins pick for a series `label` is a
    // different question and stays where it is: `DatasetWidget` overrides that
    // label from the locale bundle, so the pick is a value a caller replaces
    // rather than a value a viewer sees. Pinned here so this card cannot be
    // read as having moved both.
    expect(seriesPresentation({ name: 'total', label: MAP }).label).toBe('Revenue');
  });
});
