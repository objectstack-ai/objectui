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
 *
 * ## OWED TO objectui#11334 — a bounded ledger, not a skip
 *
 * The spec's dimensionless measure-arity check puts more types into FAMILY than
 * objectui's door refuses, because the mirror does not re-attach it yet. Those
 * types are booked in `OWED_TO_OBJECTUI_11334` below, as in the types package's
 * test: their rows assert what the panel does today, and a cap row requires the
 * set the panel fails to refuse to equal the ledger exactly.
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

/**
 * ⚠️ OWED TO objectui#11334 — the FAMILY types the panel does NOT refuse yet,
 * booked rather than skipped.
 *
 * The spec this repository resolves refuses two or more measures on these types
 * when the widget declares no `dimensions`
 * (`checkDashboardWidgetDimensionlessMeasureArity`, objectstack `11d28c17`,
 * #21053). The panel asks objectui's door (`measureRefusal`), and the door's
 * mirror does not re-attach that check: objectstack `main` renamed its export
 * (`32d57690`), and a static import of the name the resolved spec ships fails
 * the `Spec Main Shape Gate`. objectui#11334 owns the mirror; the panel follows
 * it with no edit of its own.
 *
 * Booked by objectui#11438 ruling A″ (record 5968177777), which applies
 * objectui#11111 decision 3 = B (record 5902351047) to the bump. Each listed
 * type's rows assert TODAY's behaviour (the add control is offered, and no
 * refusal is shown under a stored pair the spec refuses), and the cap row
 * requires the FAMILY types the panel fails to refuse to EQUAL this list. A new
 * difference is red, and so is a listed type the panel starts refusing: the
 * entries go stale, by name, when the mirror attaches, and objectui#11334
 * strikes them in that change.
 *
 * EXPIRES when objectui resolves an `@objectstack/spec` carrying `32d57690`, or
 * 2026-11-02, whichever is first. That resolution is caught by name in
 * `packages/types/src/__tests__/spec-object-refinements-7715.test.ts`, whose
 * census books the same check; the date is read by objectui#11334, not by a
 * clock.
 */
const OWED_TO_OBJECTUI_11334 = ['pie', 'donut', 'funnel', 'scatter', 'treemap', 'sankey', 'radar'];

/** The reason every owed row prints when it fails. */
const OWED_REASON =
  'OWED TO objectui#11334: the dimensionless measure-arity check is not re-attached by the mirror yet. ' +
  'Booked by objectui#11438 ruling A″ (record 5968177777), applying objectui#11111 decision 3 = B ' +
  '(record 5902351047). Expires when objectui resolves an @objectstack/spec carrying 32d57690, or ' +
  '2026-11-02, whichever is first.';

/** The FAMILY types the panel refuses today: FAMILY minus the ledger. */
const MIRRORED = FAMILY.filter((t) => !OWED_TO_OBJECTUI_11334.includes(t));

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
  it.each(MIRRORED)('SUBJECT: `%s` with one measure chosen offers no add control (catalog)', (type) => {
    renderPanel({ id: 'rev_tile', type, dataset: 'sales_pipeline', values: ONE });
    expect(valuesField().getByTestId('dataset-name-chip-revenue')).toBeInTheDocument();
    expect(addControl()).toBeNull();
    // Nothing is refused yet — one measure is the legal tile.
    expect(valuesField().queryByTestId('dataset-names-refusal')).toBeNull();
  });

  it.each(MIRRORED)('SUBJECT: `%s` with one measure chosen offers no add control (free text, no catalog)', (type) => {
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
  it.each(MIRRORED)('SUBJECT: a stored `%s` with two measures shows the spec\'s own refusal under them', (type) => {
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

describe('objectui#11334 — OWED: what the panel does today for the types the spec refuses and the door accepts', () => {
  it.each(OWED_TO_OBJECTUI_11334)('OWED TO objectui#11334: `%s` with one measure chosen still offers the add control (catalog)', (type) => {
    renderPanel({ id: 'rev_tile', type, dataset: 'sales_pipeline', values: ONE });
    expect(valuesField().getByTestId('dataset-name-chip-revenue')).toBeInTheDocument();
    expect(addControl(), OWED_REASON).not.toBeNull();
    expect(valuesField().queryByTestId('dataset-names-refusal'), OWED_REASON).toBeNull();
  });

  it.each(OWED_TO_OBJECTUI_11334)('OWED TO objectui#11334: `%s` with one measure chosen still offers the add control (free text, no catalog)', (type) => {
    renderPanel({ id: 'rev_tile', type, dataset: 'sales_pipeline', values: ONE }, undefined);
    expect(addControl(), OWED_REASON).not.toBeNull();
  });

  it.each(OWED_TO_OBJECTUI_11334)('OWED TO objectui#11334: a stored `%s` with two measures and no dimension shows no refusal, though the spec refuses it', (type) => {
    expect(specArityIssue(type, TWO), OWED_REASON).toBeDefined();
    renderPanel({ id: 'sales_tile', type, dataset: 'sales_pipeline', values: TWO });
    expect(valuesField().queryByTestId('dataset-names-refusal'), OWED_REASON).toBeNull();
    expect(valuesField().getByTestId('dataset-name-chip-revenue')).toBeInTheDocument();
    expect(valuesField().getByTestId('dataset-name-chip-deal_count')).toBeInTheDocument();
    expect(addControl(), OWED_REASON).not.toBeNull();
  });
});

describe('objectui#11334 — the cap: the panel fails to refuse EXACTLY the ledgered FAMILY types', () => {
  it('the FAMILY types whose stored two-measure widget shows no spec refusal equal the ledger', () => {
    const unrefused = FAMILY.filter((type) => {
      const { unmount } = renderPanel({ id: 'sales_tile', type, dataset: 'sales_pipeline', values: TWO });
      const shown = valuesField().queryByTestId('dataset-names-refusal');
      const refused = shown !== null && shown.textContent === specArityIssue(type, TWO)?.message;
      unmount();
      return !refused;
    });
    expect([...unrefused].sort(), OWED_REASON).toEqual([...OWED_TO_OBJECTUI_11334].sort());
  });

  it('the ledger leaves the metric family judged: the mirrored rows are not vacuous', () => {
    expect(MIRRORED.length).toBeGreaterThan(0);
    expect(MIRRORED).toContain('kpi');
  });
});
