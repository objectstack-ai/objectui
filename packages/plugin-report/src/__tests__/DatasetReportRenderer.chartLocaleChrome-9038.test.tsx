// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#9038, report surface — a report chart authoring `subtitle` /
 * `description` as the spec's inline-locale-map arm of `I18nLabel` got neither
 * key at all, so the chart drew no sub-heading and carried no accessible
 * description, in every language.
 *
 * The lowering these two keys travel through is `chartConfigPresentation`
 * (`@object-ui/core`), shared with the dashboard; its string-only limb erased
 * the map arm before the schema was built. The sibling
 * `DatasetReportRenderer.chartChrome.test.tsx` already pins that both keys
 * travel — with a plain STRING. This file is the other arm of the same union.
 *
 * ## Scope: `subtitle` and `description`, and why `title` is not here
 *
 * This renderer paints the chart's title itself, as its own `h3` above the
 * plot, and therefore DROPS `title` from the lowered result so the chart does
 * not draw a second one — a decision the sibling file pins. Its `h3` reads
 * `chart.title` through a plain-string narrowing of its own, so a locale-map
 * title still draws no heading on this surface. That read site is the
 * renderer's own and is outside objectui#9038's subject (the shared lowering);
 * it is reported separately rather than pinned here, because pinning it would
 * record a live defect as an expectation.
 *
 * ## Where these assertions stop
 *
 * At the schema the registered chart component is handed — the same seam the
 * sibling file stops at. What that component then DRAWS from the union is
 * pinned where recharts resolves:
 * `ChartRenderer.presentationLocaleHeading-9038.test.tsx` in
 * `@object-ui/plugin-charts` renders the same maps at two languages.
 *
 * PREDICTIONS, written before the run: both locale-map cases RED before the fix
 * (the key is absent), the plain-string control GREEN on both sides.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { ComponentRegistry } from '@object-ui/core';
import { normalizeChartSchema } from '@object-ui/plugin-charts';
import { DatasetReportRenderer } from '../DatasetReportRenderer';

let captured: { schema: Record<string, any> } | null = null;

beforeEach(() => {
  captured = null;
  ComponentRegistry.register('chart', (props: any) => {
    captured = props;
    return null;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const RESULT = {
  rows: [
    { stage: 'Qualification', amount: 120 },
    { stage: 'Negotiation', amount: 80 },
  ],
  fields: [
    { name: 'stage', type: 'text', label: 'Stage' },
    { name: 'amount', type: 'number', label: 'Amount' },
  ],
};

const sourceOf = (result: unknown) => ({ queryDataset: vi.fn(async () => result) });

const BASE = {
  name: 'pipeline_by_stage',
  type: 'tabular',
  dataset: 'pipeline_metrics',
  rows: ['stage'],
  values: ['amount'],
};

const CHART = { type: 'bar', xAxis: 'stage', yAxis: 'amount' } as const;

/** ⚠️ `en` FIRST — objectui#8943's defect was a first-string-in-key-order pick. */
const SUBTITLE = { en: 'Open pipeline only', 'zh-CN': '仅未结管道' };
const DESCRIPTION = { en: 'Amount by stage', 'zh-CN': '按阶段的金额' };

/** The schema the registered chart component was handed for this `chart` block. */
async function chartSchema(chart: Record<string, unknown>) {
  render(
    <DatasetReportRenderer
      report={{ ...BASE, chart } as never}
      dataSource={sourceOf(RESULT) as never}
    />,
  );
  await waitFor(() => expect(captured?.schema?.data?.length).toBe(2));
  return captured!.schema;
}

describe('report chart chrome — the locale-map arm travels too (objectui#9038)', () => {
  it('carries an authored locale-map `subtitle` and `description` onto the schema', async () => {
    const schema = await chartSchema({ ...CHART, subtitle: SUBTITLE, description: DESCRIPTION });
    // The failure this replaces was ABSENCE, so presence is the first pin.
    expect(schema.subtitle).toEqual(SUBTITLE);
    expect(schema.description).toEqual(DESCRIPTION);
  });

  it('resolves to either language once the renderer supplies the viewer', async () => {
    // ⚠️ An EXPLICIT language on both calls: `pickLocalized` reads an absent one
    // as `en`, so a two-language claim made without it would print the same
    // string twice and prove nothing (objectui#8943).
    const schema = await chartSchema({ ...CHART, subtitle: SUBTITLE, description: DESCRIPTION });
    const zh = normalizeChartSchema(schema, 'zh-CN');
    expect(zh.subtitle).toBe('仅未结管道');
    expect(zh.description).toBe('按阶段的金额');
    const en = normalizeChartSchema(schema, 'en');
    expect(en.subtitle).toBe('Open pipeline only');
    expect(en.description).toBe('Amount by stage');
  });

  it('still drops `title` from the lowered chrome — this renderer paints its own', async () => {
    // Not a heading claim: the pin is that the chart is NOT handed a title, so
    // it cannot draw a second one beside the `h3`. It held for the string arm
    // and must keep holding for the map arm.
    const schema = await chartSchema({ ...CHART, title: { en: 'Pricing', 'zh-CN': '定价' } });
    expect(schema.title).toBeUndefined();
  });

  it('leaves plain-string chrome exactly as it was — the live control', async () => {
    const schema = await chartSchema({
      ...CHART,
      subtitle: 'Open pipeline only',
      description: 'Amount by stage for the current quarter',
    });
    expect(schema.subtitle).toBe('Open pipeline only');
    expect(schema.description).toBe('Amount by stage for the current quarter');
  });
});
