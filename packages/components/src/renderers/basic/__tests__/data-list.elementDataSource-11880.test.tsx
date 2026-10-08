/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11880 (the repeater half) — `element:repeater` reads the node-level
 * `dataSource` binding FIRST, with its flat `properties` query keys as the
 * fallback until the spec's v18 pin bump retires them (ruling
 * objectstack-ai/objectstack#11509, A-narrow, objectui first; triage on
 * objectui#11880: direction A).
 *
 * ## The defect
 *
 * The repeater was the one element that read no binding: a repeater bound only
 * through `dataSource` issued no query and showed "No records" — the trap the
 * ruling's sub-question 4 names, indistinguishable from an object with no rows.
 *
 * ## The precedence, one table
 *
 * Where a node carries both, the repeater follows the table
 * `ElementDataSourceGate` applies to every gate-wrapped block, which is also
 * the precedence `element:number` read before objectui#11989 dropped its flat
 * keys (`object` from the binding, `filter` AND-combined):
 *
 *   - `object`: the binding's.
 *   - `filter`: the flat filter AND the binding's (which already ANDs its saved
 *     view's). Neither is dropped, so a flat filter beside a binding can never
 *     widen the list.
 *   - `sort` / `limit`: the binding's own key wins; the flat key wins over one
 *     the binding's saved VIEW supplied; the view's is the baseline. A cap the
 *     contract refuses is not authored (objectui#10016).
 *
 * That table is the one a mechanical move of the flat keys into `dataSource`
 * (filters concatenated, a key moved only where the binding lacks it) leaves
 * the rendered list unchanged by, which is what the v18 conversion relies on.
 *
 * Rendered through the real `SchemaRenderer` and this package's registration,
 * with a recording adapter, and asserted at the read the repeater issues.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import * as React from 'react';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { ComponentRegistry } from '@object-ui/core';
import { AdapterCtx, SchemaRenderer, notifyDataChanged } from '@object-ui/react';
// Registers every `element:*` renderer at module scope, not in a hook
// (object-ui/no-dynamic-import-in-test-hook, objectui#3010).
import '../../../renderers';

afterEach(cleanup);

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 60)));

const ACTIVE = [{ field: 'status', operator: 'equals', value: 'active' }];
const MINE = [{ field: 'owner', operator: 'equals', value: 'u1' }];
const BY_NAME = [{ field: 'name', order: 'asc' }];
const BY_DATE = [{ field: 'created', order: 'desc' }];

const HOT_VIEW = {
  name: 'hot',
  label: 'Hot',
  filter: [{ field: 'rating', operator: 'equals', value: 'hot' }],
  sort: [{ field: 'rating', order: 'desc' }],
  pagination: { pageSize: 7 },
};

function makeAdapter(rows: Array<Record<string, unknown>> = [{ id: 'r1', name: 'Ada' }]) {
  return {
    find: vi.fn(async (..._args: unknown[]) => ({ data: rows, total: rows.length })),
    getObjectSchema: vi.fn(async () => ({ name: 'contact', fields: {}, listViews: { hot: HOT_VIEW } })),
  };
}

function mount(fields: Record<string, unknown>, adapter = makeAdapter()) {
  render(
    <AdapterCtx.Provider value={adapter as never}>
      <SchemaRenderer schema={{ type: 'element:repeater', id: 'rep', ...fields } as never} />
    </AdapterCtx.Provider>,
  );
  return adapter;
}

/** The object and query of the first read the repeater issued. */
const firstRead = (adapter: ReturnType<typeof makeAdapter>) => {
  const [object, query] = adapter.find.mock.calls[0] as [string, Record<string, unknown>];
  return { object, query };
};

describe('element:repeater reads the node-level `dataSource` (objectui#11880)', () => {
  it('SUBJECT: a repeater bound only through `dataSource` lists its rows', async () => {
    const adapter = mount({
      dataSource: { object: 'contact', filter: ACTIVE, sort: BY_NAME, limit: 5 },
      properties: { titleField: 'name' },
    });
    await waitFor(() => expect(screen.getByTestId('repeater')).toHaveTextContent('Ada'));
    expect(firstRead(adapter)).toEqual({
      object: 'contact',
      query: { $filter: ACTIVE, $orderby: BY_NAME, $top: 5 },
    });
  });

  it('CONTROL: the flat keys alone read exactly as before the binding was read', async () => {
    const adapter = mount({ properties: { object: 'contact', titleField: 'name', filter: MINE, sort: BY_DATE, limit: 3 } });
    await waitFor(() => expect(screen.getByTestId('repeater')).toHaveTextContent('Ada'));
    expect(firstRead(adapter)).toEqual({
      object: 'contact',
      query: { $filter: MINE, $orderby: BY_DATE, $top: 3 },
    });
  });

  it('CONTROL: a binding that names no object supplies nothing — the flat keys apply', async () => {
    const adapter = mount({ dataSource: { object: '' }, properties: { object: 'contact', titleField: 'name', limit: 3 } });
    await waitFor(() => expect(screen.getByTestId('repeater')).toHaveTextContent('Ada'));
    expect(firstRead(adapter)).toEqual({ object: 'contact', query: { $top: 3 } });
  });

  it('beside the flat keys, the binding\'s object, sort and cap win and the two filters AND-combine', async () => {
    const adapter = mount({
      dataSource: { object: 'lead', filter: ACTIVE, sort: BY_NAME, limit: 5 },
      properties: { object: 'contact', titleField: 'name', filter: MINE, sort: BY_DATE, limit: 3 },
    });
    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    const { object, query } = firstRead(adapter);
    expect(object).toBe('lead');
    expect(query.$orderby).toEqual(BY_NAME);
    expect(query.$top).toBe(5);
    // Neither filter is dropped: a flat filter beside a binding narrows the
    // list further, never widens it.
    const filter = JSON.stringify(query.$filter);
    expect(filter).toContain('status');
    expect(filter).toContain('owner');
  });

  it('a binding without its own sort or cap takes the flat ones', async () => {
    const adapter = mount({
      dataSource: { object: 'lead' },
      properties: { object: 'contact', titleField: 'name', sort: BY_DATE, limit: 3 },
    });
    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    expect(firstRead(adapter)).toEqual({ object: 'lead', query: { $orderby: BY_DATE, $top: 3 } });
  });

  it('a named saved view is the baseline: the flat sort and cap win over the view\'s, and its filter ANDs in', async () => {
    const adapter = mount({
      dataSource: { object: 'contact', view: 'hot' },
      properties: { object: 'contact', titleField: 'name', filter: MINE, sort: BY_DATE, limit: 3 },
    });
    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    const { query } = firstRead(adapter);
    expect(query.$orderby).toEqual(BY_DATE);
    expect(query.$top).toBe(3);
    const filter = JSON.stringify(query.$filter);
    expect(filter).toContain('rating');
    expect(filter).toContain('owner');
  });

  it('control: with no flat sort or cap, the saved view supplies them', async () => {
    const adapter = mount({ dataSource: { object: 'contact', view: 'hot' }, properties: { object: 'contact' } });
    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    const { query } = firstRead(adapter);
    expect(query.$orderby).toEqual(HOT_VIEW.sort);
    expect(query.$top).toBe(7);
    expect(query.$filter).toEqual(HOT_VIEW.filter);
  });

  it('a cap the contract refuses is not authored: a binding `limit: 0` yields to the flat cap', async () => {
    const adapter = mount({ dataSource: { object: 'lead', limit: 0 }, properties: { object: 'contact', limit: 3 } });
    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    expect(firstRead(adapter).query.$top).toBe(3);
  });

  it('an unresolvable `view` reports, and the list issues no read — not even the flat one', async () => {
    const adapter = mount({ dataSource: { object: 'contact', view: 'nope' }, properties: { object: 'contact' } });
    await waitFor(() => expect(screen.getByTestId('repeater-datasource-error')).toBeInTheDocument());
    await settle();
    expect(adapter.find).not.toHaveBeenCalled();
  });

  it('a flat filter the converter refuses beside a binding filter reports instead of reading', async () => {
    // An ARRAY comparand on single-valued `equals` (objectui#8557): the
    // lowering the merge needs refuses it.
    const adapter = mount({
      dataSource: { object: 'contact', filter: ACTIVE },
      properties: { object: 'contact', filter: [{ field: 'tags', operator: 'equals', value: ['a'] }] },
    });
    const panel = await screen.findByTestId('repeater-datasource-error');
    // The refusal's own subject, so the author is told which rule to fix.
    expect(panel.textContent).toContain('tags');
    await settle();
    // Refused, not dropped: no list over a filter that lost a source.
    expect(adapter.find).not.toHaveBeenCalled();
  });

  it('re-reads on the bus for the BOUND object, not for the flat one beside it', async () => {
    const adapter = mount({ dataSource: { object: 'lead' }, properties: { object: 'contact', titleField: 'name' } });
    await waitFor(() => expect(adapter.find).toHaveBeenCalledTimes(1));
    await settle();

    await act(async () => {
      notifyDataChanged({ objectName: 'contact' });
    });
    await settle();
    expect(adapter.find, 'a write to the flat object re-read the bound list').toHaveBeenCalledTimes(1);

    await act(async () => {
      notifyDataChanged({ objectName: 'lead' });
    });
    await settle();
    expect(adapter.find).toHaveBeenCalledTimes(2);
    expect(adapter.find.mock.calls[1]![0]).toBe('lead');
  });
});

describe('element:repeater declares what it reads (objectui#11880)', () => {
  const inputs = () => (ComponentRegistry.getConfig('element:repeater')?.inputs ?? []) as Array<{ name: string; required?: boolean }>;

  it('publishes the injected `dataSource` beside the flat query keys it still falls back to', () => {
    const names = inputs().map((input) => input.name);
    expect(names).toContain('dataSource');
    for (const key of ['object', 'filter', 'sort', 'limit']) expect(names, key).toContain(key);
  });

  it('`object` stays required, as the spec row requires it', () => {
    expect(inputs().find((input) => input.name === 'object')?.required).toBe(true);
  });
});
