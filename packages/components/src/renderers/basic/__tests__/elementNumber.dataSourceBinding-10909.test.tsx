/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `element:number.dataSource` — the metric reads its object from the spec's
 * per-element binding (objectui#10909).
 *
 * `PageComponentSchema.dataSource` is the spec's per-element data binding, and
 * the spec lint gate (`validateComponentProps`) waives a missing
 * `properties.object` when `dataSource.object` names one, on the stated ground
 * that objectui's element renderers read the binding FIRST
 * (`ds.object ?? props.object`). `ElementNumberRenderer` read only
 * `properties.object`, so `{ dataSource: { object }, properties: { aggregate } }`
 * — a document both validators accept — issued no query at all and painted the
 * empty dash, with nothing to tell the author why.
 *
 * The renderer now reads the binding the way its element twin
 * `element:record_picker` does: through `useElementDataSource`, with the
 * binding's member winning over the flat `properties` one. This file pins the
 * member set it READS and the members it deliberately does not:
 *
 *   | member   | read? | how                                                        |
 *   |----------|-------|------------------------------------------------------------|
 *   | `object` | yes   | `dataSource.object ?? properties.object` — ONE value for   |
 *   |          |       | the fetch guard, `aggregate` / `find` and the bus key      |
 *   | `view`   | yes   | a saved view's `filter` scopes the aggregate; one that     |
 *   |          |       | cannot be resolved REPORTS and aggregates nothing          |
 *   | `filter` | yes   | `(view AND binding filter) ?? properties.filter` — the     |
 *   |          |       | twin's precedence: a binding filter wins outright          |
 *   | `sort`   | no    | an aggregate has no ordering — never reaches the call      |
 *   | `limit`  | no    | an aggregate has no row cap — a capped count is a wrong    |
 *   |          |       | number, so neither the binding's nor a view's cap reaches  |
 *   |          |       | the call                                                   |
 *
 * A metric with no binding at all is the control: it behaves exactly as before.
 * No record-context binding is added here — that is objectui#7297's, and the
 * filter shape note is objectui#8945's.
 *
 * Driven through the real `SchemaRenderer` and this package's own
 * registrations, under the `AdapterCtx` provider the renderer reads its adapter
 * from, with `aggregate` / `find` spies.
 */

import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act, cleanup, screen, waitFor } from '@testing-library/react';
import { ComponentRegistry } from '@object-ui/core';
import { AdapterCtx, SchemaRenderer, notifyDataChanged } from '@object-ui/react';
import { manifestFromConfigs, validateTree } from '@object-ui/sdui-parser';
// Registers every `element:*` renderer at module scope, not in a hook
// (object-ui/no-dynamic-import-in-test-hook, objectui#3010).
import '../../../renderers';

afterEach(cleanup);

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));

/** A saved view of `contact` — its filter is the observable proof the view resolved. */
const HOT_FILTER = [{ field: 'status', operator: 'equals', value: 'hot' }];
const HOT_VIEW = {
  name: 'hot',
  filter: HOT_FILTER,
  // Neither of these may reach an aggregate: see the whole-bag rows below.
  sort: [{ field: 'name', order: 'asc' }],
  pagination: { pageSize: 5 },
  columns: ['name'],
};

const BINDING_FILTER = [{ field: 'owner', operator: 'equals', value: 'ada' }];
const PROPS_FILTER = [{ field: 'region', operator: 'equals', value: 'emea' }];

function makeAdapter({ canAggregate = true }: { canAggregate?: boolean } = {}) {
  const rows = [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }];
  return {
    ...(canAggregate ? { aggregate: vi.fn(async () => [{ count: 7 }]) } : {}),
    find: vi.fn(async () => ({ data: rows, total: rows.length })),
    getObjectSchema: vi.fn(async (name: string) => ({ name, fields: {}, listViews: { hot: HOT_VIEW } })),
  } as {
    aggregate?: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    getObjectSchema: ReturnType<typeof vi.fn>;
  };
}

function mount(schema: Record<string, unknown>, adapter: ReturnType<typeof makeAdapter>) {
  return render(
    <AdapterCtx.Provider value={adapter as never}>
      <SchemaRenderer schema={schema as never} />
    </AdapterCtx.Provider>,
  );
}

/** The spec-valid `dataSource` form the card names. */
const BOUND = {
  type: 'element:number',
  id: 'bound',
  dataSource: { object: 'contact' },
  properties: { aggregate: 'count' },
};

/** The `properties` form — the control. */
const FLAT = {
  type: 'element:number',
  id: 'flat',
  properties: { object: 'contact', aggregate: 'count' },
};

/** The options bag a count over `contact` sends, filter aside. */
const countBag = (filter: unknown) => ({ field: undefined, function: 'count', groupBy: '_all', filter });

describe('element:number reads its object from `dataSource.object` (objectui#10909)', () => {
  it('the dataSource form calls aggregate for the bound object and paints the value', async () => {
    const adapter = makeAdapter();
    mount(BOUND, adapter);
    await waitFor(() => expect(adapter.aggregate).toHaveBeenCalledTimes(1));
    expect(adapter.aggregate).toHaveBeenCalledWith('contact', countBag(undefined));
    await waitFor(() => expect(screen.getByText('7')).toBeTruthy());
    expect(screen.queryByText('—')).toBeNull();
  });

  it('dataSource.object wins over properties.object when both are set', async () => {
    const adapter = makeAdapter();
    mount({ ...BOUND, properties: { object: 'account', aggregate: 'count' } }, adapter);
    await waitFor(() => expect(adapter.aggregate).toHaveBeenCalledTimes(1));
    await settle();
    expect(adapter.aggregate.mock.calls.map((call) => call[0])).toEqual(['contact']);
  });

  it('control: the properties form is unchanged', async () => {
    const adapter = makeAdapter();
    mount(FLAT, adapter);
    await waitFor(() => expect(adapter.aggregate).toHaveBeenCalledTimes(1));
    expect(adapter.aggregate).toHaveBeenCalledWith('contact', countBag(undefined));
    await waitFor(() => expect(screen.getByText('7')).toBeTruthy());
    // No binding means no saved-view read either.
    expect(adapter.getObjectSchema).not.toHaveBeenCalled();
  });

  it('the find() fallback reads the bound object when the adapter cannot aggregate', async () => {
    const adapter = makeAdapter({ canAggregate: false });
    mount(BOUND, adapter);
    await waitFor(() => expect(adapter.find).toHaveBeenCalledTimes(1));
    expect(adapter.find).toHaveBeenCalledWith('contact', undefined);
    await waitFor(() => expect(screen.getByText('3')).toBeTruthy());
  });

  it('a binding that names no object supplies nothing, and the flat object stands', async () => {
    // The spec gate's own reading of "supplies": an empty or non-string
    // `dataSource.object` waives nothing, so it cannot displace the flat key.
    const adapter = makeAdapter();
    mount({ ...FLAT, dataSource: { object: '' } }, adapter);
    await waitFor(() => expect(adapter.aggregate).toHaveBeenCalledTimes(1));
    expect(adapter.aggregate).toHaveBeenCalledWith('contact', countBag(undefined));
  });
});

describe('element:number re-reads the dataSource form on the data-invalidation bus (objectui#10909)', () => {
  it('one bus event re-reads it, keyed on the resolved object', async () => {
    const adapter = makeAdapter();
    mount(BOUND, adapter);
    await waitFor(() => expect(adapter.aggregate).toHaveBeenCalledTimes(1));
    await settle();

    await act(async () => {
      notifyDataChanged({ objectName: 'some_other_object' });
    });
    await settle();
    expect(adapter.aggregate, 'a change to another object re-read the metric').toHaveBeenCalledTimes(1);

    await act(async () => {
      notifyDataChanged({ objectName: 'contact' });
    });
    await settle();
    expect(adapter.aggregate, 'the bound object changed and the metric never re-read').toHaveBeenCalledTimes(2);
  });

  it('the key is the binding, not the flat object it outranks', async () => {
    const adapter = makeAdapter();
    mount({ ...BOUND, properties: { object: 'account', aggregate: 'count' } }, adapter);
    await waitFor(() => expect(adapter.aggregate).toHaveBeenCalledTimes(1));
    await settle();

    await act(async () => {
      notifyDataChanged({ objectName: 'account' });
    });
    await settle();
    expect(adapter.aggregate, 'a change to the outranked flat object re-read the metric').toHaveBeenCalledTimes(1);

    await act(async () => {
      notifyDataChanged({ objectName: 'contact' });
    });
    await settle();
    expect(adapter.aggregate).toHaveBeenCalledTimes(2);
    expect(adapter.aggregate.mock.calls.map((call) => call[0])).toEqual(['contact', 'contact']);
  });
});

describe('element:number — the `dataSource` members it reads, and the ones it does not (objectui#10909)', () => {
  it('filter: the binding filter scopes the aggregate', async () => {
    const adapter = makeAdapter();
    mount({ ...BOUND, dataSource: { object: 'contact', filter: BINDING_FILTER } }, adapter);
    await waitFor(() => expect(adapter.aggregate).toHaveBeenCalledTimes(1));
    expect(adapter.aggregate).toHaveBeenCalledWith('contact', countBag(BINDING_FILTER));
  });

  it('filter: a binding filter wins outright over properties.filter, which applies only when the binding carries none', async () => {
    const both = makeAdapter();
    mount(
      {
        ...BOUND,
        dataSource: { object: 'contact', filter: BINDING_FILTER },
        properties: { aggregate: 'count', filter: PROPS_FILTER },
      },
      both,
    );
    await waitFor(() => expect(both.aggregate).toHaveBeenCalledTimes(1));
    expect(both.aggregate).toHaveBeenCalledWith('contact', countBag(BINDING_FILTER));
    cleanup();

    const flatOnly = makeAdapter();
    mount({ ...BOUND, properties: { aggregate: 'count', filter: PROPS_FILTER } }, flatOnly);
    await waitFor(() => expect(flatOnly.aggregate).toHaveBeenCalledTimes(1));
    expect(flatOnly.aggregate).toHaveBeenCalledWith('contact', countBag(PROPS_FILTER));
  });

  it("view: a named saved view's filter scopes the aggregate", async () => {
    const adapter = makeAdapter();
    mount({ ...BOUND, dataSource: { object: 'contact', view: 'hot' } }, adapter);
    await waitFor(() => expect(adapter.aggregate).toHaveBeenCalledTimes(1));
    expect(adapter.getObjectSchema).toHaveBeenCalledWith('contact');
    expect(adapter.aggregate).toHaveBeenCalledWith('contact', countBag(HOT_FILTER));
  });

  it('view: one that cannot be resolved reports and aggregates nothing', async () => {
    const adapter = makeAdapter();
    mount({ ...BOUND, dataSource: { object: 'contact', view: 'no_such_view' } }, adapter);
    await waitFor(() => expect(screen.getByTestId('element-number-datasource-error')).toBeTruthy());
    await settle();
    expect(adapter.aggregate).not.toHaveBeenCalled();
    expect(adapter.find).not.toHaveBeenCalled();
  });

  it('sort and limit are not read: the options bag stays whole with a binding and a view carrying both', async () => {
    const adapter = makeAdapter();
    mount(
      {
        ...BOUND,
        dataSource: { object: 'contact', view: 'hot', sort: [{ field: 'name', order: 'desc' }], limit: 2 },
      },
      adapter,
    );
    await waitFor(() => expect(adapter.aggregate).toHaveBeenCalledTimes(1));
    const [object, bag] = adapter.aggregate.mock.calls[0];
    expect(object).toBe('contact');
    expect(Object.keys(bag).sort()).toEqual(['field', 'filter', 'function', 'groupBy']);
    expect(bag).toEqual(countBag(HOT_FILTER));
  });

  it('limit is not read on the find() fallback either: a count is never capped', async () => {
    const adapter = makeAdapter({ canAggregate: false });
    mount({ ...BOUND, dataSource: { object: 'contact', limit: 2 } }, adapter);
    await waitFor(() => expect(adapter.find).toHaveBeenCalledTimes(1));
    expect(adapter.find).toHaveBeenCalledWith('contact', undefined);
    await waitFor(() => expect(screen.getByText('3')).toBeTruthy());
  });
});

describe('element:number declares the `dataSource` binding it reads (objectui#10909)', () => {
  const inputs = () => ComponentRegistry.getMeta('element:number')?.inputs ?? [];

  it('the registration declares dataSource as an object binding, and object is no longer required', () => {
    const dataSource = inputs().find((input) => input.name === 'dataSource');
    expect(dataSource, 'element:number publishes no dataSource input').toBeTruthy();
    expect((dataSource as { binding?: string }).binding).toBe('object');
    const object = inputs().find((input) => input.name === 'object');
    expect(object).toBeTruthy();
    expect(object?.required).not.toBe(true);
  });

  it('the html tier accepts the dataSource form without a diagnostic', () => {
    const manifest = manifestFromConfigs(
      ComponentRegistry.getAllConfigs() as unknown as Parameters<typeof manifestFromConfigs>[0],
    );
    const { diagnostics } = validateTree(
      { type: 'element:number', dataSource: { object: 'contact' }, aggregate: 'count' } as never,
      manifest,
    );
    expect(diagnostics.map((d) => d.message)).toEqual([]);
    // Control: a block that does not read the binding is still told.
    const control = validateTree({ type: 'element:text', dataSource: { object: 'contact' } } as never, manifest);
    expect(control.diagnostics.map((d) => d.message)).toContain('<element:text> has no prop "dataSource"');
  });
});
