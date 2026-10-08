// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11823 (step 2) — what the Interfaces pillar's New dashboard / New
 * report write, judged by the spec, and the report's dataset/measure fields.
 * The pillar-level pins (the writes, the rail, the canvas) are in
 * `StudioDesignSurface.interfacesCreate-11823.test.tsx`.
 */

import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AppSchema, DashboardSchema, NavigationItemSchema, ReportSchema } from '@objectstack/spec/ui';

let datasets: Array<Record<string, unknown>>;
const mockClient = {
  list: vi.fn(async () => datasets),
  get: vi.fn(async () => undefined),
};

vi.mock('../metadata-admin/useMetadata', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../metadata-admin/useMetadata')>();
  return { ...mod, useMetadataClient: () => mockClient };
});

import {
  NO_REPORT_BINDING,
  ReportCreateFields,
  buildDashboardSkeleton,
  buildReportSkeleton,
  interfaceNavEntry,
  isReportBindingComplete,
  type ReportBinding,
} from './interfaceCreate';
import type { NavNode } from './navSurface';

beforeEach(() => {
  datasets = [
    {
      name: 'orders_ds',
      label: 'Orders',
      measures: [{ name: 'revenue', label: 'Revenue' }],
      dimensions: [{ name: 'region' }],
    },
    { name: 'tickets_ds', label: 'Tickets', measures: [{ name: 'ticket_count' }], dimensions: [] },
  ];
});
afterEach(cleanup);

describe('the create bodies parse with the spec (objectui#11823 step 2)', () => {
  it('a dashboard with no widget yet', () => {
    const body = buildDashboardSkeleton('sales_overview', 'Sales overview');
    const parsed = DashboardSchema.safeParse(body);
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
  });

  it('a report bound to a dataset and one of its measures', () => {
    const body = buildReportSkeleton('revenue_by_region', 'Revenue by region', { dataset: 'orders_ds', measure: 'revenue' });
    const parsed = ReportSchema.safeParse(body);
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
  });

  it('CONTROL: the spec refuses a report with no dataset, which is why the dialog asks for one', () => {
    const { dataset: _dataset, values: _values, ...unbound } = buildReportSkeleton('r', 'R', {
      dataset: 'orders_ds',
      measure: 'revenue',
    }) as Record<string, unknown>;
    const parsed = ReportSchema.safeParse(unbound);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((i) => i.path.join('.'))).toContain('dataset');
  });

  it('a binding is complete only with both a dataset and a measure', () => {
    expect(isReportBindingComplete(NO_REPORT_BINDING)).toBe(false);
    expect(isReportBindingComplete({ dataset: 'orders_ds', measure: '' })).toBe(false);
    expect(isReportBindingComplete({ dataset: 'orders_ds', measure: 'revenue' })).toBe(true);
  });
});

describe('the navigation entry that links a new item (objectui#11823 step 2)', () => {
  const navigation: NavNode[] = [
    { id: 'nav_sales', type: 'dashboard', dashboardName: 'old_sales' },
    {
      id: 'grp',
      type: 'group',
      label: 'More',
      children: [{ id: 'nav_sales_2', type: 'url', label: 'Docs', url: 'https://example.com' }],
    },
  ];

  it('takes an id no entry holds, at any depth', () => {
    expect(interfaceNavEntry('dashboard', 'sales', 'Sales', navigation).id).toBe('nav_sales_3');
    expect(interfaceNavEntry('dashboard', 'pipeline', 'Pipeline', navigation).id).toBe('nav_pipeline');
  });

  it('a dashboard entry carries no label, so it inherits the dashboard\'s; a report entry carries the author\'s', () => {
    expect(interfaceNavEntry('dashboard', 'pipeline', 'Pipeline', navigation)).toEqual({
      id: 'nav_pipeline',
      type: 'dashboard',
      dashboardName: 'pipeline',
    });
    expect(interfaceNavEntry('report', 'revenue', 'Revenue', navigation)).toEqual({
      id: 'nav_revenue',
      type: 'report',
      reportName: 'revenue',
      label: 'Revenue',
    });
  });

  it('each entry parses as a navigation item, and in an app document beside the entries it joins', () => {
    for (const kind of ['dashboard', 'report'] as const) {
      const entry = interfaceNavEntry(kind, 'sales', 'Sales', navigation);
      const item = NavigationItemSchema.safeParse(entry);
      expect(item.success, JSON.stringify(item.error?.issues)).toBe(true);
      const app = AppSchema.safeParse({ name: 'acme_app', label: 'Acme', navigation: [...navigation, entry] });
      expect(app.success, JSON.stringify(app.error?.issues)).toBe(true);
    }
  });
});

describe('ReportCreateFields (objectui#11823 step 2)', () => {
  function Host({ initial = NO_REPORT_BINDING }: { initial?: ReportBinding }) {
    const [value, setValue] = React.useState<ReportBinding>(initial);
    return (
      <>
        <ReportCreateFields value={value} onChange={setValue} locale="en-US" />
        <output data-testid="binding">{JSON.stringify(value)}</output>
      </>
    );
  }

  it('chooses nothing for the author, and a dataset change clears the measure', async () => {
    render(<Host />);
    const dataset = await screen.findByTestId('create-report-dataset');
    expect((dataset as HTMLSelectElement).value).toBe('');
    expect(screen.queryByTestId('create-report-measure')).toBeNull();

    fireEvent.change(dataset, { target: { value: 'orders_ds' } });
    const measure = await screen.findByTestId('create-report-measure');
    expect((measure as HTMLSelectElement).value).toBe('');
    fireEvent.change(measure, { target: { value: 'revenue' } });
    expect(screen.getByTestId('binding')).toHaveTextContent('{"dataset":"orders_ds","measure":"revenue"}');

    fireEvent.change(dataset, { target: { value: 'tickets_ds' } });
    expect(screen.getByTestId('binding')).toHaveTextContent('{"dataset":"tickets_ds","measure":""}');
  });

  it('says so when there is no dataset to report on', async () => {
    datasets = [];
    render(<Host />);
    expect(await screen.findByTestId('create-report-no-datasets')).toHaveTextContent(
      'There is no dataset to report on yet.',
    );
    expect(screen.queryByTestId('create-report-dataset')).toBeNull();
  });
});
