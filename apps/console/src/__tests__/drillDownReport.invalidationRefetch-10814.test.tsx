/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10814 — the `drillDown.report` arm of `DrillDownDrawer` (the drill
 * of the `object-pivot` and `object-metric` blocks) renders a `spec-report`
 * through `SchemaRenderer`, so the dataset report it draws re-reads on the
 * data-invalidation bus with the reader the report renderer carries itself. The
 * drawer needs no reader of its own.
 *
 * Here, not beside the drawer: the drawer lives in `@object-ui/plugin-dashboard`
 * and the `spec-report` it dispatches to is registered by
 * `@object-ui/plugin-report`, which that package does not depend on. The
 * console depends on both, which is the pairing a real drill runs in.
 *
 * The drawer is mounted open with a dataset-bound matrix report (the shape the
 * drawer's report arm takes: a report carrying a `columns` array), under a
 * provider whose adapter counts `queryDataset` calls. The bare
 * `useDataInvalidation` reader beside it is the positive control.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup, waitFor } from '@testing-library/react';
import { SchemaRendererProvider, notifyDataChanged, useDataInvalidation } from '@object-ui/react';
import { DrillDownDrawer } from '@object-ui/plugin-dashboard';
// Registers `spec-report`, the type the drawer's report arm renders.
import '@object-ui/plugin-report';

beforeEach(() => {
  // The report's dimension-label probe is best-effort; answer it empty.
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ item: { fields: {} } }) })));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  cleanup();
});

function makeDataSource() {
  let amount = 100;
  return {
    setAmount(next: number) {
      amount = next;
    },
    find: vi.fn(async () => ({ data: [], total: 0 })),
    queryDataset: vi.fn(async () => ({
      rows: [{ stage: 'Won', owner: 'Ada', amount_sum: amount }],
      fields: [
        { name: 'stage', type: 'string', label: 'Stage' },
        { name: 'owner', type: 'string', label: 'Owner' },
        { name: 'amount_sum', type: 'number', label: 'Amount' },
      ],
      object: 'deal',
    })),
  };
}

function BusControl() {
  const nonce = useDataInvalidation('deal');
  return <span data-testid="bus-control">{nonce}</span>;
}

const REPORT = {
  name: 'deals_by_stage_and_owner',
  type: 'matrix',
  dataset: 'deals_ds',
  rows: ['stage'],
  columns: ['owner'],
  values: ['amount_sum'],
};

const renderDrawer = (ds: ReturnType<typeof makeDataSource>) =>
  render(
    <SchemaRendererProvider dataSource={ds as any}>
      <BusControl />
      <DrillDownDrawer open onClose={() => {}} title="Deals" objectName="deal" report={REPORT} />
    </SchemaRendererProvider>,
  );

async function emit(change: { objectName: string; recordId?: string }) {
  await act(async () => {
    notifyDataChanged(change);
    await Promise.resolve();
  });
}

describe('a drill-down drawer’s `drillDown.report` re-reads on the data-invalidation bus (objectui#10814)', () => {
  it('re-reads after "*" and after its own object, not after another object, in place', async () => {
    const ds = makeDataSource();
    const { getByTestId } = renderDrawer(ds);
    await waitFor(() => expect(document.querySelector('[data-testid="dataset-matrix"]')).not.toBeNull());
    expect(ds.queryDataset).toHaveBeenCalledTimes(1);
    expect(ds.find, 'the drawer drew its record list instead of the report').not.toHaveBeenCalled();
    const matrix = document.querySelector('[data-testid="dataset-matrix"]');

    ds.setAmount(250);
    await emit({ objectName: '*' });
    expect(getByTestId('bus-control').textContent, 'control: the event never reached a subscriber').toBe('1');
    await waitFor(() => expect(ds.queryDataset, 'the drill report never re-read').toHaveBeenCalledTimes(2));
    await waitFor(() => expect(document.querySelector('[data-testid="dataset-matrix"]')?.textContent).toContain('250'));
    expect(document.querySelector('[data-testid="dataset-matrix"]'), 'the re-read remounted the report').toBe(matrix);

    await emit({ objectName: 'some_other_object' });
    expect(ds.queryDataset, 'a change to another object re-read the drill report').toHaveBeenCalledTimes(2);

    await emit({ objectName: 'deal' });
    await waitFor(() => expect(ds.queryDataset).toHaveBeenCalledTimes(3));
  });
});
