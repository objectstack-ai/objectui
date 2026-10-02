/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8894 — `WidgetConfigPanel`'s measure picker never builds what the
 * widget door refuses.
 *
 * `@objectstack/spec` 17.5.0 refuses a second measure on a metric-family
 * widget (ruling D on the card), and objectui's `DashboardWidgetSchema`
 * re-attaches that check. The picker used to offer a second, third, … measure
 * on a `metric` with no signal, and the author met the refusal at publish.
 * Now it asks the same door (`measureRefusal`):
 *
 *   - one more measure would be refused → the add control is not offered;
 *   - the measures already on the widget are refused (a stored document) →
 *     the door's own message is shown under them at once.
 *
 * ## The family is the SPEC'S, derived at run time — never a list written here
 *
 * As in `packages/types/src/__tests__/dashboard-widget-metric-measure-door-8894.test.ts`:
 * every member of the spec's `ChartTypeSchema` is put through the spec's own
 * `DashboardWidgetSchema` with two measures, and the types refused with a
 * `custom` issue at `values` ARE the family. The rows below move with the spec.
 *
 * A refusal shown in the panel is asserted to EQUAL the spec's message for the
 * same document, read off the spec's own parse: equal text proves the panel
 * surfaces the door's verdict rather than a restatement of it.
 */

import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import {
  ChartTypeSchema as SpecChartTypeSchema,
  DashboardWidgetSchema as SpecDashboardWidgetSchema,
} from '@objectstack/spec/ui';
import { WidgetConfigPanel } from '../WidgetConfigPanel';
import type { WidgetDatasetCatalogEntry } from '../dataset-catalog';

afterEach(cleanup);

type Issue = { code: string; path: PropertyKey[]; message: string };

const catalog: WidgetDatasetCatalogEntry[] = [
  {
    name: 'sales_pipeline',
    label: 'Sales Pipeline',
    dimensions: [{ name: 'stage' }],
    measures: [
      { name: 'revenue', aggregate: 'sum' },
      { name: 'deal_count', aggregate: 'count' },
      { name: 'margin', aggregate: 'sum' },
    ],
  },
];

const ONE = ['revenue'];
const TWO = ['revenue', 'deal_count'];

/** The spec's arity issue for a widget, read off the spec's own parse, or `undefined`. */
const specArityIssue = (type: string | undefined, values: string[], id = 'sales_tile'): Issue | undefined => {
  const doc = { id, dataset: 'sales_pipeline', ...(type === undefined ? {} : { type }), values };
  const r = SpecDashboardWidgetSchema.safeParse(doc);
  if (r.success) return undefined;
  return (r.error.issues as Issue[]).find((i) => i.code === 'custom' && i.path.map(String).join('.') === 'values');
};

const SPEC_TYPES: readonly string[] = SpecChartTypeSchema.options;
/** The metric family, as the spec's rule draws it. */
const FAMILY = SPEC_TYPES.filter((t) => specArityIssue(t, TWO) !== undefined);
/** Every other spec widget type. */
const OTHERS = SPEC_TYPES.filter((t) => !FAMILY.includes(t));

const renderPanel = (config: Record<string, unknown>, datasets: WidgetDatasetCatalogEntry[] | undefined = catalog) =>
  render(<WidgetConfigPanel open onClose={vi.fn()} config={config} onSave={vi.fn()} datasets={datasets} />);

const valuesField = () => within(screen.getByTestId('config-field-values'));
/** The add control: the catalog combobox, or the free-text input without a catalog. */
const addControl = () => valuesField().queryByRole('combobox') ?? valuesField().queryByRole('textbox');

describe('objectui#8894 — the family is read off the spec\'s rule, and it is not vacuous', () => {
  it('the spec refuses a second measure on some types and not on others', () => {
    // An empty family would make every `it.each` below run zero rows and pass.
    expect(FAMILY.length).toBeGreaterThan(0);
    expect(OTHERS.length).toBeGreaterThan(0);
    // Triage named this one when it set the picker's pin on the card.
    expect(FAMILY).toContain('kpi');
  });
});

describe('objectui#8894 — no second measure is offered on a metric-family widget', () => {
  it.each(FAMILY)('SUBJECT: `%s` with one measure chosen offers no add control (catalog)', (type) => {
    renderPanel({ id: 'rev_tile', type, dataset: 'sales_pipeline', values: ONE });
    expect(valuesField().getByTestId('dataset-name-chip-revenue')).toBeInTheDocument();
    expect(addControl()).toBeNull();
    // Nothing is refused yet — one measure is the legal tile.
    expect(valuesField().queryByTestId('dataset-names-refusal')).toBeNull();
  });

  it.each(FAMILY)('SUBJECT: `%s` with one measure chosen offers no add control (free text, no catalog)', (type) => {
    renderPanel({ id: 'rev_tile', type, dataset: 'sales_pipeline', values: ONE }, undefined);
    expect(addControl()).toBeNull();
  });

  it.each(FAMILY)('CONTROL: `%s` with NO measure yet still offers the add control — the first one is legal', (type) => {
    renderPanel({ id: 'rev_tile', type, dataset: 'sales_pipeline', values: [] });
    expect(addControl()).not.toBeNull();
  });

  it.each(OTHERS)('CONTROL: `%s` with one measure keeps offering another', (type) => {
    renderPanel({ id: 'rev_tile', type, dataset: 'sales_pipeline', values: ONE });
    expect(addControl()).not.toBeNull();
    expect(valuesField().queryByTestId('dataset-names-refusal')).toBeNull();
  });
});

describe('objectui#8894 — measures the door refuses are reported at once, in the door\'s words', () => {
  it.each(FAMILY)('SUBJECT: a stored `%s` with two measures shows the spec\'s own refusal under them', (type) => {
    renderPanel({ id: 'sales_tile', type, dataset: 'sales_pipeline', values: TWO });
    const shown = valuesField().getByTestId('dataset-names-refusal');
    expect(shown).toHaveAttribute('role', 'alert');
    expect(shown.textContent).toBe(specArityIssue(type, TWO)!.message);
    // Both measures stay on screen — the picker reports, it never drops one
    // for the author — and a third is not offered.
    expect(valuesField().getByTestId('dataset-name-chip-revenue')).toBeInTheDocument();
    expect(valuesField().getByTestId('dataset-name-chip-deal_count')).toBeInTheDocument();
    expect(addControl()).toBeNull();
  });

  it('SUBJECT: a widget with NO type and two measures is refused too — the spec resolves it to its default', () => {
    renderPanel({ id: 'sales_tile', dataset: 'sales_pipeline', values: TWO });
    expect(valuesField().getByTestId('dataset-names-refusal').textContent).toBe(specArityIssue(undefined, TWO)!.message);
  });

  it.each(OTHERS)('CONTROL: `%s` with two measures is not refused, and offers a third', (type) => {
    renderPanel({ id: 'sales_tile', type, dataset: 'sales_pipeline', dimensions: ['stage'], values: TWO });
    expect(valuesField().queryByTestId('dataset-names-refusal')).toBeNull();
    expect(addControl()).not.toBeNull();
  });
});
