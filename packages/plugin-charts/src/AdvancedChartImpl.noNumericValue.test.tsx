/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * A numeric axis with rows and nothing to build a scale from (objectui#7195,
 * ruled A): the tile says so, keyed on the WHOLE dataset, instead of drawing an
 * axis frame with zero marks.
 *
 * ## Why the predicate is about the axis and not about booleans
 *
 * Whether a boolean places depends on its neighbours: beside one real number
 * Recharts coerces it onto the scale and draws it; with every row boolean there
 * is no scale and nothing draws. A "reject booleans" predicate would footnote
 * the mixed tile with a false sentence, so the question asked here is the one
 * whose answer does not depend on the neighbours — does ANY row give this axis
 * a value it can build a scale from. Every refused shape below drew zero marks
 * before the change, and every shape pinned as drawing drew marks; the mark
 * counts are re-derived in this file under the same fixed-size harness.
 *
 * ## What "a value it can build a scale from" measured as
 *
 * Not `Number.isFinite`: numeric strings draw on every family, `''` draws at
 * zero on line / area / scatter, a two-number range `[lo, hi]` draws on a range
 * bar / area, and a STACKED series reads booleans through d3's
 * `Number(value)` and draws them. The predicate mirrors Recharts' own domain
 * reader (`makeDomain` over `makeNumber`), plus that stack exception; the cases
 * below pin each clause from the side that must keep drawing. A bound key that
 * is no row's own property (a dotted path, an absent column) is unresolved and
 * keeps the tile silent.
 */
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render as rtlRender, cleanup, type RenderOptions } from '@testing-library/react';
import { I18nProvider } from '@object-ui/i18n';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<any>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) =>
      React.cloneElement(children, { width: 480, height: 320 }),
  };
});

import AdvancedChartImpl from './AdvancedChartImpl';

/**
 * Mounted under an `I18nProvider`, as the console always does, so the
 * provider-less `NO_I18NEXT_INSTANCE` notice cannot reach the `console.warn`
 * spy that reads the chart's own diagnostics.
 */
function EnSession({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider config={{ defaultLanguage: 'en', detectBrowserLanguage: false }} persistLanguage={false}>
      {children}
    </I18nProvider>
  );
}
const render = ((ui: React.ReactElement, options?: RenderOptions) =>
  rtlRender(ui, { wrapper: EnSession, ...options })) as typeof rtlRender;

afterEach(cleanup);

type Row = Record<string, unknown>;

const CODE = 'no-numeric-value';
const refusalOf = (c: HTMLElement) => c.querySelector(`[data-chart-error="${CODE}"]`);
const anyRefusalOf = (c: HTMLElement) =>
  c.querySelector('[data-chart-error]')?.getAttribute('data-chart-error') ?? null;
const plotOf = (c: HTMLElement) => c.querySelector('[data-slot="chart"]');

/** Every mark a cartesian family paints, as a count of non-empty shapes. */
const marksOf = (c: HTMLElement) =>
  c.querySelectorAll('path.recharts-symbols').length +
  c.querySelectorAll('path.recharts-rectangle').length +
  Array.from(c.querySelectorAll('.recharts-line-curve, .recharts-area-area')).filter(
    (p) => (p.getAttribute('d') ?? '').length > 0,
  ).length;

const renderScatter = (data: Row[], props: Record<string, unknown> = {}) =>
  render(
    <AdvancedChartImpl
      chartType="scatter"
      xAxisKey="xm"
      series={[{ dataKey: 'ym' }] as any}
      data={data as any}
      isAnimationActive={false}
      {...(props as any)}
    />,
  );

const renderFamily = (
  chartType: string,
  data: Row[],
  series: Array<Record<string, unknown>> = [{ dataKey: 'v' }],
  props: Record<string, unknown> = {},
) =>
  render(
    <AdvancedChartImpl
      chartType={chartType as any}
      xAxisKey="k"
      series={series as any}
      data={data as any}
      isAnimationActive={false}
      {...(props as any)}
    />,
  );

/** The series families the refusal covers — `column` is the spec alias of `bar`. */
const FAMILIES = ['bar', 'column', 'horizontal-bar', 'line', 'area', 'combo'];

describe('objectui#7195 — THE CONTROLS draw, so every zero below carries information', () => {
  it('a two-measure scatter draws every mark', () => {
    const { container } = renderScatter([{ xm: 10, ym: 40 }, { xm: 20, ym: 25 }]);
    expect(marksOf(container)).toBe(2);
    expect(anyRefusalOf(container)).toBeNull();
  });

  for (const family of FAMILIES) {
    it(`${family}: a numeric series draws`, () => {
      const { container } = renderFamily(family, [{ k: 'a', v: 3 }, { k: 'b', v: 5 }]);
      expect(marksOf(container)).toBeGreaterThan(0);
      expect(anyRefusalOf(container)).toBeNull();
    });
  }
});

describe('objectui#7195 — scatter: an axis with no numeric value on any row is refused', () => {
  it('x all-boolean: refused, naming x and the row count', () => {
    const { container } = renderScatter([{ xm: true, ym: 40 }, { xm: false, ym: 25 }]);
    const refusal = refusalOf(container);
    expect(refusal).not.toBeNull();
    expect(refusal!.getAttribute('role')).toBe('status');
    expect(refusal!.textContent).toContain('none of the 2 rows has a numeric value for xm');
    // Only the dead axis is named: y carries numbers.
    expect(refusal!.textContent).not.toContain('ym');
    expect(plotOf(container)).toBeNull();
  });

  it('y all-boolean: refused, naming y', () => {
    const { container } = renderScatter([{ xm: 10, ym: true }, { xm: 20, ym: false }]);
    expect(refusalOf(container)!.textContent).toContain('numeric value for ym');
    expect(refusalOf(container)!.textContent).not.toContain('xm');
  });

  it('both axes all-boolean: refused, naming both', () => {
    const { container } = renderScatter([{ xm: true, ym: true }, { xm: false, ym: false }]);
    expect(refusalOf(container)!.textContent).toContain('numeric value for xm or ym');
  });

  it('a boolean beside unplaceable rows: refused, where the footnote used to claim a point was drawn', () => {
    // Measured before the change: 0 marks under an `unplotted-points` note
    // saying 1 of 2 rows was not drawn — i.e. that the other one was.
    const { container } = renderScatter([{ xm: true, ym: 40 }, { xm: null, ym: 25 }]);
    expect(refusalOf(container)).not.toBeNull();
    expect(container.querySelector('[data-chart-note="unplotted-points"]')).toBeNull();
  });

  it('a single all-boolean row reads in the singular', () => {
    const { container } = renderScatter([{ xm: true, ym: 40 }]);
    expect(refusalOf(container)!.textContent).toContain('its only row has no numeric value for xm');
  });

  it('the refusal names the keys it was given, not a hardcoded pair', () => {
    const { container } = renderScatter(
      [{ lat: true, lng: 1 }, { lat: false, lng: 2 }],
      { xAxisKey: 'lat', series: [{ dataKey: 'lng' }] },
    );
    expect(refusalOf(container)!.textContent).toContain('numeric value for lat');
  });
});

describe('objectui#7195 — scatter: what must keep DRAWING, silently', () => {
  const DRAWS: Array<[string, Row[], number]> = [
    ['a boolean beside one real number (the reverse control)', [{ xm: 10, ym: 40 }, { xm: true, ym: 25 }, { xm: false, ym: 60 }], 3],
    ['numeric strings', [{ xm: '10', ym: 40 }, { xm: '20', ym: 25 }], 2],
    ['a boolean beside a numeric string', [{ xm: '10', ym: 40 }, { xm: true, ym: 25 }], 2],
    ['empty strings, placed at zero', [{ xm: '', ym: 40 }, { xm: '', ym: 25 }], 2],
    ['Date values', [{ xm: new Date(0), ym: 40 }, { xm: new Date(1e12), ym: 25 }], 2],
  ];
  for (const [label, data, marks] of DRAWS) {
    it(`${label}: ${marks} marks, no refusal`, () => {
      const { container } = renderScatter(data);
      expect(marksOf(container)).toBe(marks);
      expect(anyRefusalOf(container)).toBeNull();
    });
  }
});

describe('objectui#7195 — scatter: the refusals it ranks BELOW keep their own codes', () => {
  it('a multi-series scatter is still a binding fault first', () => {
    const { container } = renderScatter(
      [{ xm: true, ym: 1, zm: 2 }, { xm: false, ym: 3, zm: 4 }],
      { series: [{ dataKey: 'ym' }, { dataKey: 'zm' }] },
    );
    expect(anyRefusalOf(container)).toBe('scatter-multi-series');
  });

  it('rows with no placeable pair at all keep the positional refusal', () => {
    const { container } = renderScatter([{ xm: null, ym: 40 }, { xm: 'n/a', ym: 25 }]);
    expect(anyRefusalOf(container)).toBe('no-plottable-points');
  });

  it('handed no rows, nothing is said', () => {
    const { container } = renderScatter([]);
    expect(anyRefusalOf(container)).toBeNull();
  });
});

describe('objectui#7195 — series families: no series has a numeric value on any row', () => {
  const REFUSED: Array<[string, Row[]]> = [
    ['all-boolean', [{ k: 'a', v: true }, { k: 'b', v: false }]],
    ['all-true', [{ k: 'a', v: true }, { k: 'b', v: true }]],
    ['all-null', [{ k: 'a', v: null }, { k: 'b', v: null }]],
    ['all unparseable strings', [{ k: 'a', v: 'n/a' }, { k: 'b', v: 'x' }]],
  ];
  for (const family of FAMILIES) {
    for (const [label, data] of REFUSED) {
      it(`${family}, ${label}: refused with the key and the count, and no plot`, () => {
        const { container } = renderFamily(family, data);
        const refusal = refusalOf(container);
        expect(refusal).not.toBeNull();
        expect(refusal!.textContent).toContain('none of the 2 rows has a numeric value for v');
        expect(plotOf(container)).toBeNull();
      });
    }

    it(`${family}, two series both all-boolean: refused, naming both`, () => {
      const { container } = renderFamily(
        family,
        [{ k: 'a', v: true, w: true }, { k: 'b', v: false, w: false }],
        [{ dataKey: 'v' }, { dataKey: 'w' }],
      );
      expect(refusalOf(container)!.textContent).toContain('numeric value for v or w');
    });

    it(`${family}, stacked all-null: refused — the stack reads null as zero and draws nothing`, () => {
      const { container } = renderFamily(
        family,
        [{ k: 'a', v: null, w: null }, { k: 'b', v: null, w: null }],
        [{ dataKey: 'v', stack: 's' }, { dataKey: 'w', stack: 's' }],
      );
      expect(refusalOf(container)).not.toBeNull();
    });
  }
});

describe('objectui#7195 — series families: what must keep DRAWING, silently', () => {
  for (const family of FAMILIES) {
    it(`${family}: a boolean beside a number draws (the reverse control)`, () => {
      const { container } = renderFamily(family, [{ k: 'a', v: 3 }, { k: 'b', v: true }, { k: 'c', v: false }]);
      expect(marksOf(container)).toBeGreaterThan(0);
      expect(anyRefusalOf(container)).toBeNull();
    });

    it(`${family}: numeric strings draw`, () => {
      const { container } = renderFamily(family, [{ k: 'a', v: '3' }, { k: 'b', v: '5' }]);
      expect(marksOf(container)).toBeGreaterThan(0);
      expect(anyRefusalOf(container)).toBeNull();
    });

    it(`${family}: an all-boolean series beside a numeric one draws — keyed on ALL series, never per series`, () => {
      const { container } = renderFamily(
        family,
        [{ k: 'a', v: 3, w: true }, { k: 'b', v: 5, w: false }],
        [{ dataKey: 'v' }, { dataKey: 'w' }],
      );
      expect(marksOf(container)).toBeGreaterThan(0);
      expect(anyRefusalOf(container)).toBeNull();
    });

    it(`${family}: handed no rows, nothing is said`, () => {
      const { container } = renderFamily(family, []);
      expect(anyRefusalOf(container)).toBeNull();
    });
  }

  for (const family of ['line', 'area']) {
    it(`${family}: empty strings draw at zero, so they anchor`, () => {
      const { container } = renderFamily(family, [{ k: 'a', v: '' }, { k: 'b', v: '' }]);
      expect(marksOf(container)).toBeGreaterThan(0);
      expect(anyRefusalOf(container)).toBeNull();
    });
  }

  for (const family of ['bar', 'area']) {
    it(`${family}: a RANGE series ([lo, hi] per row) draws — Recharts' makeDomain anchors a two-number array`, () => {
      const { container } = renderFamily(family, [{ k: 'a', v: [1, 3] }, { k: 'b', v: [2, 5] }]);
      expect(marksOf(container)).toBeGreaterThan(0);
      expect(anyRefusalOf(container)).toBeNull();
    });
  }

  it('a range with a boolean end does not anchor, so an axis of only those is refused', () => {
    const { container } = renderFamily('bar', [{ k: 'a', v: [true, 3] }, { k: 'b', v: [false, 5] }]);
    expect(refusalOf(container)).not.toBeNull();
  });

  for (const family of ['bar', 'line']) {
    it(`${family}: a DOTTED dataKey beside an all-boolean series draws — an unresolved key keeps the tile silent`, () => {
      // Recharts reads `get(row, 'a.b')`; this predicate does not walk paths,
      // so a key that is no row's own property is unresolved and it says nothing.
      const { container } = renderFamily(
        family,
        [{ k: 'a', a: { b: 3 }, w: true }, { k: 'b', a: { b: 5 }, w: false }],
        [{ dataKey: 'a.b' }, { dataKey: 'w' }],
      );
      expect(marksOf(container)).toBeGreaterThan(0);
      expect(anyRefusalOf(container)).toBeNull();
    });
  }

  it('one bound key no row carries keeps the tile silent even beside an all-boolean series', () => {
    const { container } = renderFamily(
      'bar',
      [{ k: 'a', w: true }, { k: 'b', w: false }],
      [{ dataKey: 'value' }, { dataKey: 'w' }],
    );
    expect(refusalOf(container)).toBeNull();
  });

  for (const family of ['bar', 'horizontal-bar', 'area', 'combo']) {
    it(`${family}: a STACKED all-boolean series draws — d3's stack reads booleans as numbers`, () => {
      const { container } = renderFamily(
        family,
        [{ k: 'a', v: true }, { k: 'b', v: true }],
        [{ dataKey: 'v', stack: 's' }],
      );
      expect(marksOf(container)).toBeGreaterThan(0);
      expect(anyRefusalOf(container)).toBeNull();
    });
  }

  for (const family of ['bar', 'line', 'area', 'combo']) {
    it(`${family}: a dual-axis tile with one dead axis still draws the live one — measured and declined`, () => {
      const { container } = renderFamily(
        family,
        [{ k: 'a', v: 3, w: true }, { k: 'b', v: 5, w: true }],
        [{ dataKey: 'v' }, { dataKey: 'w', yAxis: 'right' }],
        { yAxes: [{ position: 'left' }, { position: 'right' }] },
      );
      expect(marksOf(container)).toBeGreaterThan(0);
      expect(anyRefusalOf(container)).toBeNull();
    });
  }
});

describe('objectui#7195 — the seams with the refusals already on this surface', () => {
  it('a bound key NO row carries is left to its own question (the objectui#8266 shape)', () => {
    // A different diagnosis — the binding names a column the rows do not have
    // — whose render pins keep it silent until it is re-decided on its own.
    const { container } = renderFamily('bar', [{ k: 'a', count: 2 }, { k: 'b', count: 5 }], [{ dataKey: 'value' }]);
    expect(refusalOf(container)).toBeNull();
  });

  it('missing-category-key still wins: rows without the category key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = renderFamily('bar', [{ v: true }, { v: false }]);
    expect(anyRefusalOf(container)).toBe('missing-category-key');
    warn.mockRestore();
  });

  it('no-plottable-series still wins: no series bound at all', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = renderFamily('bar', [{ k: 'a', v: true }], []);
    expect(anyRefusalOf(container)).toBe('no-plottable-series');
    warn.mockRestore();
  });

  it('a magnitude family never receives this code', () => {
    for (const family of ['pie', 'donut', 'funnel', 'treemap']) {
      const { container } = renderFamily(family, [{ k: 'a', v: true }, { k: 'b', v: false }]);
      expect(refusalOf(container), `${family} must not get ${CODE}`).toBeNull();
      cleanup();
    }
  });

  it('prints no console warning, matching the scatter answers', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderScatter([{ xm: true, ym: 40 }, { xm: false, ym: 25 }]);
    cleanup();
    renderFamily('bar', [{ k: 'a', v: true }, { k: 'b', v: false }]);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
