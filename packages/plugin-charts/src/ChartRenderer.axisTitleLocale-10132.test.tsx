/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10132, half 2 — the card's acceptance at runtime: a chart config
 * whose `xAxis.title` / `yAxis[].title` is an inline locale map draws the
 * axis title **in the viewer's language, at two languages**, on the path a
 * dataset-bound surface actually takes.
 *
 * The seam half lives in `@object-ui/core`
 * (`chart-presentation.axisTitleI18n-10132.test.ts`) and pins that the
 * authored union survives the lowering. It cannot pin what a viewer sees.
 *
 * ## Why the two-language pair IS the lit control here
 *
 * The defect did not erase the title — it painted the FIRST string in key
 * order, so one language always looked right. A single-language assertion is
 * therefore green against the defect for whichever language the author typed
 * first. Each map below is written **`en` first** and both languages are
 * asserted in the same file: the `zh-CN` case can only pass if the viewer's
 * language decided the limb.
 *
 * ## The schema is BUILT by the real lowering, not restated
 *
 * `mergeAuthoredPresentation` is imported from `@object-ui/core` and its
 * `axes` result is spread onto the schema exactly as `DatasetWidget` spreads
 * it. Restating the lowered shape would pass with the lowering still broken.
 *
 * `ChartRenderer` is rendered rather than `AdvancedChartImpl`: it is what the
 * ComponentRegistry resolves `type: 'chart'` to, and it holds the
 * `useObjectTranslation` hook the resolver needs.
 */

import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';

// Recharts' ResponsiveContainer measures via ResizeObserver, which reports 0×0
// under the headless DOM, so nothing paints. Fix its size — the same double the
// sibling presentation-heading test installs, for the same reason.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<any>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) =>
      React.cloneElement(children, { width: 480, height: 320 }),
  };
});

// `ChartRenderer` renders its implementation behind
// `React.lazy(() => import('./AdvancedChartImpl'))`. Importing it here — with the
// SAME specifier, so the ESM cache satisfies the lazy factory — pays the recharts
// graph in the import phase, which no test timeout applies to (AGENTS.md §测试纪律).
import './AdvancedChartImpl';
import { mergeAuthoredPresentation } from '@object-ui/core';
import { I18nProvider } from '@object-ui/i18n';
import { ChartRenderer } from './ChartRenderer';

afterEach(cleanup);

/** ⚠️ `en` FIRST — see the key-order control above. */
const X_TITLE = { en: 'Stage', 'zh-CN': '阶段' };
const Y_TITLE = { en: 'Revenue', 'zh-CN': '收入' };

/** Stable config objects — `I18nProvider` rebuilds its instance when `config` changes identity. */
const ZH = { defaultLanguage: 'zh-CN', detectBrowserLanguage: false };
const EN = { defaultLanguage: 'en', detectBrowserLanguage: false };

/** The dataset-derived half, which this card does not touch. */
const derived = [{ dataKey: 'total', label: 'Total' }];

const DATA = [
  { status: 'open', total: 120 },
  { status: 'paid', total: 80 },
];

/**
 * Mount the authored chart config at one language, through the REAL lowering,
 * and wait for the plot rather than the lazy skeleton.
 */
async function renderAuthored(chartConfig: Record<string, unknown>, config: Record<string, unknown>) {
  const { series, axes } = mergeAuthoredPresentation(derived as never, chartConfig);
  const schema = {
    type: 'chart',
    chartType: 'bar' as const,
    data: DATA,
    xAxisKey: 'status',
    series,
    isAnimationActive: false,
    ...axes,
  };
  const { container } = render(
    <I18nProvider persistLanguage={false} config={config as never}>
      <ChartRenderer schema={schema as any} />
    </I18nProvider>,
  );
  await waitFor(() => expect(container.querySelector('.recharts-surface')).toBeTruthy());
  return container;
}

const AUTHORED = {
  xAxis: { field: 'status', title: X_TITLE },
  yAxis: [{ field: 'total', title: Y_TITLE }],
};

describe('an authored locale-map axis title reaches the DOM in the viewer language (objectui#10132)', () => {
  it('draws the zh-CN axis titles to a zh-CN viewer', async () => {
    const container = await renderAuthored(AUTHORED, ZH);
    expect(container.textContent).toContain('阶段');
    expect(container.textContent).toContain('收入');
    // The `en` entries — written FIRST in every map — must not be on screen.
    expect(container.textContent).not.toContain('Stage');
    expect(container.textContent).not.toContain('Revenue');
  });

  it('draws the en entries to an en viewer — the same maps, the other titles', async () => {
    const container = await renderAuthored(AUTHORED, EN);
    expect(container.textContent).toContain('Stage');
    expect(container.textContent).toContain('Revenue');
    expect(container.textContent).not.toContain('阶段');
    expect(container.textContent).not.toContain('收入');
  });

  it('a plain-string axis title is unchanged by either language — the live control', async () => {
    for (const config of [ZH, EN]) {
      const container = await renderAuthored(
        { xAxis: { field: 'status', title: 'Stage' }, yAxis: [{ field: 'total', title: 'Revenue' }] },
        config,
      );
      expect(container.textContent).toContain('Stage');
      expect(container.textContent).toContain('Revenue');
      cleanup();
    }
  });

  it('an axis with no title draws none, in either language — the absence control', async () => {
    // The neighbouring failure mode objectui#9038 measured on the chrome keys:
    // a lowering that ERASES the map arm instead of forwarding it draws nothing
    // at all. This case fixes what "nothing" looks like so that outcome cannot
    // be mistaken for a pass.
    const container = await renderAuthored(
      { xAxis: { field: 'status' }, yAxis: [{ field: 'total' }] },
      ZH,
    );
    expect(container.textContent).not.toContain('阶段');
    expect(container.textContent).not.toContain('Stage');
  });
});
