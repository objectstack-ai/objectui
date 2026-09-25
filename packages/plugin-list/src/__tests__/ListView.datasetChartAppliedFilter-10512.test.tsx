/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10512 — while a dataset-bound `chart` is on screen, a user filter
 * that is already held does not narrow `ListView`'s own fetch.
 *
 * THE DEFECT. objectui#10327 withholds the toolbar Filter builder and the
 * `UserFilters` chips on a dataset-bound chart (`datasetChartOnScreen`): the
 * chart takes its scope from the dataset, and neither control reaches it. It
 * withheld only the CONTROLS. A Filter group the host restores at mount
 * (`initialFilters`, which app-shell's `ObjectView` reads back from per-view
 * storage), or one set on a grid before switching, still reached this
 * component's own fetch of the list object's rows. That fetch still runs on
 * the chart and feeds the record-count bar, which still draws there. So the
 * count was narrowed by a filter nothing on screen showed or could clear.
 *
 * objectui#10326 closed the same shape for Search (`searchTerm` is derived
 * empty beside the held `searchInput`); this is the Filter half.
 *
 * WHAT IS PINNED.
 *
 *   - On a dataset-bound chart the fetch runs and the count bar draws, and a
 *     restored Filter group narrows neither: the data source receives no
 *     `$filter`, and the bar counts the unnarrowed rows.
 *   - The view's own `filter` is not the user's. On the same chart it stays in
 *     the query, alone.
 *   - The held state is KEPT, not cleared: a switch back to the grid applies
 *     the same group again, the builder shows it, and the host is never told
 *     to drop it. Chips toggled on the grid are withheld on the chart too.
 *   - CONTROLS: on a grid, and on a chart bound to the list object (whose node
 *     carries the effective filter, objectui#10250), the restored group still
 *     narrows the fetch.
 *   - With nothing held, the switch into the dataset chart re-issues no query:
 *     the withholding does not reopen objectui#7394.
 *
 * Each case first waits for the view's stand-in, so a mount that never reached
 * the view's render branch reads as a broken harness, never as a pass.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { ComponentRegistry } from '@object-ui/core';
import { SchemaRendererProvider } from '@object-ui/react';
import { ListView } from '../ListView';

let chartNodes: Array<Record<string, unknown>> = [];

ComponentRegistry.register(
  'object-grid',
  () => <div data-testid="grid-standin" />,
  { namespace: 'test', label: 'object-grid stand-in', category: 'view' },
);
ComponentRegistry.register(
  'object-chart',
  ({ schema }: { schema: Record<string, unknown> }) => {
    chartNodes.push(schema);
    return <div data-testid="chart-standin" />;
  },
  { namespace: 'test', label: 'object-chart stand-in', category: 'view' },
);

const objectDef = {
  name: 'duly_task',
  label: 'Task',
  fields: {
    id: { name: 'id', type: 'text' },
    subject: { name: 'subject', type: 'text', label: 'Subject' },
    status: { name: 'status', type: 'text', label: 'Status' },
    priority: { name: 'priority', type: 'text', label: 'Priority' },
    owner: { name: 'owner', type: 'text', label: 'Owner' },
    estimate: { name: 'estimate', type: 'number', label: 'Estimate' },
  },
};

const ROWS = [
  { id: '1', subject: 'Task 1', status: 'open', priority: 'high', owner: 'ada', estimate: 3 },
  { id: '2', subject: 'Task 2', status: 'done', priority: 'low', owner: 'ada', estimate: 5 },
  { id: '3', subject: 'Task 3', status: 'done', priority: null, owner: 'bob', estimate: 8 },
];

/**
 * Answers each query from the fields its `$filter` names, so the record-count
 * bar reads a different number for a narrowed query than for an unnarrowed one.
 */
function makeDataSource() {
  return {
    find: vi.fn(async (_object: string, params?: Record<string, unknown>) => {
      const named = JSON.stringify(params?.$filter ?? null);
      let out = ROWS;
      if (named.includes('"status"')) out = out.filter((r) => r.status === 'open');
      if (named.includes('"priority"')) out = out.filter((r) => r.priority != null);
      if (named.includes('"owner"')) out = out.filter((r) => r.owner === 'ada');
      return { data: out, total: out.length };
    }),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn(async () => objectDef),
  } as never as { find: ReturnType<typeof vi.fn> };
}

const DATASET_BLOCK = { chartType: 'bar', dataset: 'task_ds', dimensions: ['status'], values: ['total_estimate'] };
const OBJECT_BLOCK = { chartType: 'bar', xAxisField: 'status', yAxisFields: ['estimate'], aggregation: 'sum' };
/** A `UserFilters` toggle chip, OFF at mount; clicking it adds `priority != null`. */
const TOGGLE_CHIP = { element: 'toggle', fields: [{ field: 'priority' }] };
/** The view's own `filter` — authored, or merged in by the host (URL filters). */
const BASE_FILTER = [['owner', '=', 'ada']];

/** The toolbar Filter builder's group, as the host restores it at mount. */
const RESTORED_FILTERS = {
  id: 'root',
  logic: 'and' as const,
  conditions: [{ id: 'c1', field: 'status', operator: 'equals', value: 'open' }],
};

function mount(view: Record<string, unknown>, listProps: Record<string, unknown> = {}) {
  const dataSource = makeDataSource();
  const schema = { type: 'list-view', objectName: 'duly_task', columns: ['subject'], ...view };
  render(
    <SchemaRendererProvider dataSource={dataSource as never}>
      <ListView schema={schema as never} dataSource={dataSource as never} {...listProps} />
    </SchemaRendererProvider>,
  );
  return dataSource;
}

const onScreen = (testId: string) => waitFor(() => expect(screen.getByTestId(testId)).toBeInTheDocument());
/** The `$filter` of every host (`ListView`) fetch, in order. */
const hostFilters = (dataSource: { find: ReturnType<typeof vi.fn> }) =>
  dataSource.find.mock.calls.map((c: unknown[]) => (c[1] as Record<string, unknown> | undefined)?.$filter);
const names = (filter: unknown, field: string) => JSON.stringify(filter ?? null).includes(`"${field}"`);
const countBar = () => screen.getByTestId('record-count-bar');
const filterButton = () => screen.queryByRole('button', { name: /filter/i });
const settle = () => new Promise((r) => setTimeout(r, 50));

const pick = (name: string) => {
  const trigger = screen.queryByTestId('view-switcher-dropdown');
  if (trigger) fireEvent.click(trigger);
  fireEvent.click(screen.queryByRole('tab', { name }) ?? screen.getByRole('button', { name }));
};

beforeEach(() => {
  chartNodes = [];
});
afterEach(cleanup);

describe('objectui#10512 — a held user filter does not narrow ListView\'s fetch while a dataset-bound chart is on screen', () => {
  it('CONTROL: on a grid, a restored Filter group narrows the fetch, and the count bar counts the narrowed rows', async () => {
    const dataSource = mount({ viewType: 'grid' }, { initialFilters: RESTORED_FILTERS });
    await onScreen('grid-standin');
    await waitFor(() => expect(names(hostFilters(dataSource).at(-1), 'status')).toBe(true));
    await waitFor(() => expect(countBar()).toHaveTextContent('1 record'));
  });

  it('CONTROL: on a chart bound to the list object, a restored Filter group still narrows the fetch', async () => {
    const dataSource = mount({ viewType: 'chart', chart: OBJECT_BLOCK }, { initialFilters: RESTORED_FILTERS });
    await onScreen('chart-standin');
    expect(chartNodes.at(-1)).toMatchObject({ type: 'object-chart', objectName: 'duly_task' });
    await waitFor(() => expect(dataSource.find).toHaveBeenCalled());
    await settle();
    expect(names(hostFilters(dataSource).at(-1), 'status')).toBe(true);
  });

  it('on a dataset-bound chart the fetch runs and the count bar draws, and a restored Filter group narrows neither', async () => {
    const onFilterChange = vi.fn();
    const dataSource = mount({ viewType: 'chart', chart: DATASET_BLOCK }, { initialFilters: RESTORED_FILTERS, onFilterChange });
    await onScreen('chart-standin');
    expect(chartNodes.at(-1)).toMatchObject({ type: 'object-chart', dataset: 'task_ds' });
    await waitFor(() => expect(dataSource.find).toHaveBeenCalled());
    await settle();
    expect(hostFilters(dataSource).every((f) => f === undefined)).toBe(true);
    expect(countBar()).toHaveTextContent('3 records');
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('the view\'s own `filter` is not the user\'s: on the dataset chart it stays in the query, alone', async () => {
    const dataSource = mount(
      { viewType: 'chart', chart: DATASET_BLOCK, filter: BASE_FILTER },
      { initialFilters: RESTORED_FILTERS },
    );
    await onScreen('chart-standin');
    await waitFor(() => expect(dataSource.find).toHaveBeenCalled());
    await settle();
    expect(hostFilters(dataSource).every((f) => JSON.stringify(f) === JSON.stringify(BASE_FILTER))).toBe(true);
    expect(countBar()).toHaveTextContent('2 records');
  });

  it('a filter held on a grid stops narrowing the fetch on a switch to the dataset chart, and applies again back on the grid', async () => {
    const onFilterChange = vi.fn();
    const dataSource = mount(
      {
        viewType: 'grid',
        chart: DATASET_BLOCK,
        userFilters: TOGGLE_CHIP,
        appearance: { allowedVisualizations: ['grid', 'chart'] },
      },
      { showViewSwitcher: true, initialFilters: RESTORED_FILTERS, onFilterChange },
    );
    await onScreen('grid-standin');
    await waitFor(() => expect(names(hostFilters(dataSource).at(-1), 'status')).toBe(true));

    // A chip toggled on the grid joins the held state.
    fireEvent.click(await screen.findByRole('button', { name: /priority/i }));
    await waitFor(() => expect(names(hostFilters(dataSource).at(-1), 'priority')).toBe(true));

    pick('Chart');
    await onScreen('chart-standin');
    await waitFor(() => expect(hostFilters(dataSource).at(-1)).toBeUndefined());
    await waitFor(() => expect(countBar()).toHaveTextContent('3 records'));

    pick('Grid');
    await onScreen('grid-standin');
    await waitFor(() => expect(names(hostFilters(dataSource).at(-1), 'status')).toBe(true));
    // Kept, not cleared: the builder still shows the group, and the host was
    // never told to drop it.
    expect(filterButton()).toHaveTextContent('1');
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it('CONTROL (objectui#7394): with nothing held, the switch to the dataset chart re-issues no query', async () => {
    const dataSource = mount(
      { viewType: 'grid', chart: DATASET_BLOCK, appearance: { allowedVisualizations: ['grid', 'chart'] } },
      { showViewSwitcher: true },
    );
    await onScreen('grid-standin');
    await waitFor(() => expect(dataSource.find).toHaveBeenCalled());
    await settle();
    const before = dataSource.find.mock.calls.length;

    pick('Chart');
    await onScreen('chart-standin');
    await settle();
    expect(dataSource.find.mock.calls.length).toBe(before);
  });
});
