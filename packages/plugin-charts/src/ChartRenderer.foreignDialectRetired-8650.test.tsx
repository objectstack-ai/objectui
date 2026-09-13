/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8650 — the "Tremor/simple format" adapter inside `ChartRenderer` is
 * retired, and the four keys it read do NOT share one verdict.
 *
 * ## What was measured, and why the four split
 *
 * The card filed this as one group of four undeclared reads. A cast-aware read
 * census (`schemaReads`, objectui#6576) plus a TypeScript-checker declaredness
 * reading (`getPropertyOfType`, never a grep — objectui#8410) measured them
 * apart:
 *
 *   - `categories` is a DECLARED member of the published `ChartSchema` and of
 *     its zod mirror, is documented in the schema reference as an alternative
 *     series list, and was ruled LIVE by objectui#6896. It was never a foreign
 *     spelling. `normalizeChartSchema` — the ONE translation point
 *     (objectui#2880 S1) — already consumed it, so `ChartRenderer`'s own branch
 *     was a SECOND, un-normalized read of a key the normalizer owns and could
 *     not be reached by any well-formed chart. ⇒ the branch goes, the
 *     capability stays. The cases below pin that it still plots.
 *   - `index`, `category` and `value` are declared on NO published face, are
 *     advertised by no registry `inputs`, are taught by no doc or skill, and a
 *     structural producer census over this repo found ZERO nodes writing them.
 *     ⇒ retired, per AGENTS.md #0.1 (the remedy belongs at the producer, and
 *     there is no producer).
 *
 * ## The failure mode the retirement degrades to — measured, not assumed
 *
 * Dropping the axis aliases does not produce a silently wrong picture:
 * `AdvancedChartImpl` REFUSES a chart whose category axis binds to no column
 * and says so on screen (objectui#8168's family). The refusal is what these
 * cases observe structurally — no plot surface — rather than by its wording,
 * which no consumer parses.
 *
 * ⭐ Every refusal below is read against the CANONICAL control in the same
 * file: the same data and the same chart, written with `xAxisKey` / `series`,
 * must plot. Without it a renderer that had stopped drawing anything at all
 * would satisfy every negative case here.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';

// Recharts' ResponsiveContainer measures via ResizeObserver, which reports 0×0
// under the headless DOM, so nothing paints. Fix its size.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<any>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) =>
      React.cloneElement(children, { width: 480, height: 320 }),
  };
});

import { ChartRenderer } from './ChartRenderer';
// `ChartRenderer` lazy-loads its implementation; import it eagerly with the
// SAME specifier so the dynamic import's cost lands in the import phase rather
// than inside `waitFor`'s budget (the reasoning is spelled out in
// `ChartRenderer.specSeries.test.tsx`).
import './AdvancedChartImpl';

afterEach(cleanup);

const DATA = [
  { month: 'Jan', revenue: 120, margin: 40 },
  { month: 'Feb', revenue: 80, margin: 90 },
];

const marks = (c: HTMLElement) => ({
  bars: c.querySelectorAll('.recharts-bar').length,
  lines: c.querySelectorAll('.recharts-line').length,
});

/** Waits for the real plot past the lazy boundary, then counts the marks. */
const plotted = async (c: HTMLElement) => {
  await waitFor(() => expect(c.querySelector('.recharts-surface')).toBeTruthy());
  return marks(c);
};

/** The negative reading: give the lazy chunk the same chance, then assert it never plotted. */
const neverPlots = async (c: HTMLElement) => {
  await new Promise((r) => setTimeout(r, 150));
  return c.querySelector('.recharts-surface') === null;
};

const renderChart = (schema: Record<string, unknown>) =>
  render(<ChartRenderer schema={schema as any} />).container;

describe('objectui#8650 — the canonical spellings still plot (the control)', () => {
  it('plots `xAxisKey` + `series` — every refusal below is read against this', async () => {
    const container = renderChart({
      type: 'chart',
      chartType: 'bar',
      data: DATA,
      xAxisKey: 'month',
      series: [{ dataKey: 'revenue' }, { dataKey: 'margin' }],
      isAnimationActive: false,
    });
    expect(await plotted(container)).toEqual({ bars: 2, lines: 0 });
  });
});

describe('objectui#8650 — `categories` is NOT retired: the declared key still plots', () => {
  it('plots a `categories` series list through `normalizeChartSchema`', async () => {
    // The read that used to serve this case lived in `ChartRenderer`; it is
    // gone, and the chart still draws both columns because the ONE translation
    // point has always consumed this key. If this case ever reds, the
    // objectui#6896 capability was removed by accident.
    const container = renderChart({
      type: 'chart',
      chartType: 'bar',
      data: DATA,
      xAxisKey: 'month',
      categories: ['revenue', 'margin'],
      isAnimationActive: false,
    });
    expect(await plotted(container)).toEqual({ bars: 2, lines: 0 });
  });

  it('still ignores `categories` when `series` is present — the documented precedence', async () => {
    const container = renderChart({
      type: 'chart',
      chartType: 'bar',
      data: DATA,
      xAxisKey: 'month',
      series: [{ dataKey: 'revenue' }],
      categories: ['revenue', 'margin'],
      isAnimationActive: false,
    });
    expect(await plotted(container)).toEqual({ bars: 1, lines: 0 });
  });

  it('no longer throws on a malformed `categories` — the retired branch called `.map` on it', async () => {
    // `categories: 'revenue'` (a string, not a list) reached `.map` on a string
    // in the retired branch and threw during render. The normalizer answers
    // "no series" instead, which is the honest reading of an off-contract
    // value: the chart mounts, and plots nothing.
    const container = renderChart({
      type: 'chart',
      chartType: 'bar',
      data: DATA,
      xAxisKey: 'month',
      categories: 'revenue',
      isAnimationActive: false,
    });
    await waitFor(() => expect(container.querySelector('.recharts-surface')).toBeTruthy());
    expect(marks(container)).toEqual({ bars: 0, lines: 0 });
  });
});

describe('objectui#8650 — the foreign dialect is retired', () => {
  it('`index` no longer binds the category axis', async () => {
    const container = renderChart({
      type: 'chart',
      chartType: 'bar',
      data: DATA,
      index: 'month',
      series: [{ dataKey: 'revenue' }, { dataKey: 'margin' }],
      isAnimationActive: false,
    });
    expect(await neverPlots(container)).toBe(true);
  });

  it('`category` no longer binds the category axis', async () => {
    const container = renderChart({
      type: 'chart',
      chartType: 'bar',
      data: DATA,
      category: 'month',
      series: [{ dataKey: 'revenue' }, { dataKey: 'margin' }],
      isAnimationActive: false,
    });
    expect(await neverPlots(container)).toBe(true);
  });

  it('`value` no longer becomes a single series', async () => {
    const container = renderChart({
      type: 'chart',
      chartType: 'bar',
      data: DATA,
      xAxisKey: 'month',
      value: 'revenue',
      isAnimationActive: false,
    });
    // The axis IS bound here, so this case isolates the series half: the chart
    // may still reach the plot surface, but nothing is plotted from `value`.
    const surface = await new Promise<HTMLElement | null>((r) =>
      setTimeout(() => r(container.querySelector('.recharts-surface')), 150),
    );
    expect(surface ? marks(container) : { bars: 0, lines: 0 }).toEqual({ bars: 0, lines: 0 });
  });
});
