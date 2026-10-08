/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `element:repeater.dataSource` — the list reads its query from the node-level
 * binding, and from nowhere else (objectui#11880, the objectui half of
 * objectstack#11509, ruled A-narrow).
 *
 * `RepeaterRenderer` used to read `properties.object` / `filter` / `sort` /
 * `limit` only, and was registered without `elementDataSourceBlock`, so a
 * repeater bound only through `dataSource` — which the spec's page component
 * accepts and its lint gate waives `properties.object` for — issued no query
 * and drew "No records". The members, as the list now reads them:
 *
 *   | member   | read? | how                                                    |
 *   |----------|-------|--------------------------------------------------------|
 *   | `object` | yes   | the object `find` lists; none while a named view is    |
 *   |          |       | unresolved, and none without a binding                 |
 *   | `view`   | yes   | a saved view's filter / sort / row cap are the         |
 *   |          |       | baseline; one that cannot be resolved REPORTS          |
 *   | `filter` | yes   | `$filter`, AND-combined with the view's, context       |
 *   |          |       | tokens resolved first                                  |
 *   | `sort`   | yes   | `$orderby`, the binding's over the view's              |
 *   | `limit`  | yes   | `$top`, the binding's over the view's                  |
 *
 * The flat `properties.object` / `filter` / `sort` / `limit` are read by
 * nothing: alone they list nothing, and beside a binding they change nothing.
 *
 * Driven through the real `SchemaRenderer` and this package's own
 * registrations, under the `AdapterCtx` provider the renderer reads its adapter
 * from, with a recording `find`.
 */

import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentRegistry } from '@object-ui/core';
import { AdapterCtx, FilterScopeProvider, SchemaRenderer } from '@object-ui/react';
// Registers every `element:*` renderer at module scope, not in a hook
// (object-ui/no-dynamic-import-in-test-hook, objectui#3010).
import '../../../renderers';

afterEach(cleanup);

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

const ROWS = [
  { id: 'c1', name: 'Ada', email: 'ada@example.com' },
  { id: 'c2', name: 'Grace', email: 'grace@example.com' },
];

const HOT_VIEW = {
  name: 'hot',
  filter: [{ field: 'status', operator: 'equals', value: 'hot' }],
  sort: [{ field: 'name', order: 'desc' }],
  pagination: { pageSize: 7 },
};

function makeAdapter() {
  return {
    find: vi.fn(async (_object: string, _query: Record<string, unknown>) => ({ data: ROWS })),
    getObjectSchema: vi.fn(async () => ({ name: 'contact', fields: {}, listViews: { hot: HOT_VIEW } })),
  };
}

function mount(node: Record<string, unknown>, adapter = makeAdapter()) {
  render(
    <FilterScopeProvider currentUserId="user-1" currentOrgId="org-1">
      <AdapterCtx.Provider value={adapter as never}>
        <SchemaRenderer schema={{ type: 'element:repeater', ...node } as never} />
      </AdapterCtx.Provider>
    </FilterScopeProvider>,
  );
  return adapter;
}

/** The printed values of every line, in DOM order. */
const lines = () =>
  [...screen.getByTestId('repeater').querySelectorAll('li')].map((li) =>
    [...li.querySelectorAll('span')].map((span) => span.textContent),
  );

const DISPLAY = { titleField: 'name', fields: ['email'] };

describe('element:repeater reads its query from `dataSource` (objectui#11880)', () => {
  it('a repeater bound only through `dataSource` lists its rows, with object, filter, sort and limit from the binding', async () => {
    const adapter = mount({
      dataSource: {
        object: 'contact',
        filter: [{ field: 'owner', operator: 'equals', value: '{current_user_id}' }],
        sort: [{ field: 'name', order: 'asc' }],
        limit: 2,
      },
      properties: DISPLAY,
    });
    await waitFor(() => expect(screen.getByTestId('repeater')).toBeInTheDocument());
    expect(lines()).toEqual([
      ['Ada', 'ada@example.com'],
      ['Grace', 'grace@example.com'],
    ]);
    // Every read, so a first query without the binding's members cannot hide
    // behind a later one.
    for (const [object, query] of adapter.find.mock.calls) {
      expect(object).toBe('contact');
      expect(query).toEqual({
        $filter: [{ field: 'owner', operator: 'equals', value: 'user-1' }],
        $orderby: [{ field: 'name', order: 'asc' }],
        $top: 2,
      });
    }
  });

  it('CONTROL: a repeater with no `dataSource.object` issues no query and shows its empty state', async () => {
    const adapter = mount({ properties: { ...DISPLAY, emptyText: 'Nothing bound' } });
    await settle();
    expect(adapter.find).not.toHaveBeenCalled();
    expect(screen.getByText('Nothing bound')).toBeInTheDocument();
    expect(screen.queryByTestId('repeater')).toBeNull();
  });

  it('the flat `properties.object` / `filter` / `sort` / `limit` alone list nothing', async () => {
    const adapter = mount({
      properties: {
        ...DISPLAY,
        object: 'contact',
        filter: [{ field: 'status', operator: 'equals', value: 'open' }],
        sort: [{ field: 'name', order: 'asc' }],
        limit: 5,
      },
    });
    await settle();
    expect(adapter.find).not.toHaveBeenCalled();
    expect(screen.getByText('No records')).toBeInTheDocument();
  });

  it('beside a binding, the flat keys change nothing: only the binding reaches the query', async () => {
    const adapter = mount({
      dataSource: { object: 'contact' },
      properties: {
        ...DISPLAY,
        object: 'lead',
        filter: [{ field: 'status', operator: 'equals', value: 'open' }],
        sort: [{ field: 'name', order: 'asc' }],
        limit: 5,
      },
    });
    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    for (const [object, query] of adapter.find.mock.calls) {
      expect(object).toBe('contact');
      expect(query).toEqual({});
    }
  });

  it("a named view's filter, sort and row cap are the baseline; the binding's own sort and limit win, its filter AND-combines", async () => {
    const adapter = mount({ dataSource: { object: 'contact', view: 'hot' }, properties: DISPLAY });
    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    expect(adapter.find.mock.calls[0][1]).toEqual({
      $filter: HOT_VIEW.filter,
      $orderby: HOT_VIEW.sort,
      $top: 7,
    });
    cleanup();

    const bound = mount({
      dataSource: {
        object: 'contact',
        view: 'hot',
        filter: [{ field: 'owner', operator: 'equals', value: 'ada' }],
        sort: [{ field: 'email', order: 'asc' }],
        limit: 3,
      },
      properties: DISPLAY,
    });
    await waitFor(() => expect(bound.find).toHaveBeenCalled());
    const query = bound.find.mock.calls[0][1] as Record<string, unknown>;
    expect(query.$orderby).toEqual([{ field: 'email', order: 'asc' }]);
    expect(query.$top).toBe(3);
    const filter = JSON.stringify(query.$filter);
    expect(filter).toContain('status');
    expect(filter).toContain('owner');
  });

  it('an unresolvable view reports and lists nothing', async () => {
    const adapter = mount({ dataSource: { object: 'contact', view: 'nope' }, properties: DISPLAY });
    await waitFor(() => expect(screen.getByTestId('repeater-datasource-error')).toBeInTheDocument());
    expect(adapter.find).not.toHaveBeenCalled();
    expect(screen.getByTestId('repeater-datasource-error').textContent).toContain('hot');
  });
});

describe('element:repeater declares the binding it reads (objectui#11880)', () => {
  const inputNames = () => (ComponentRegistry.getConfig('element:repeater')?.inputs ?? []).map((i) => i.name);

  it('publishes `dataSource` and none of the four flat query keys', () => {
    expect(inputNames()).toContain('dataSource');
    for (const flat of ['object', 'filter', 'sort', 'limit']) {
      expect(inputNames(), `element:repeater publishes the flat '${flat}'`).not.toContain(flat);
    }
    // CONTROL: the display keys the list does read stay published.
    for (const display of ['titleField', 'fields', 'emptyText', 'divided']) {
      expect(inputNames()).toContain(display);
    }
  });
});
