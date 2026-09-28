/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10887 member 1 — an `object-view` in a non-grid view re-reads its
 * rows when the data-invalidation bus (`notifyDataChanged` from
 * `@object-ui/react`) reports a change to the object it queries.
 *
 * For every non-grid view `ObjectView` fetches the rows itself and hands them
 * to the inner view as `data`, which switches off that view's own bus reader.
 * Before this card the fetch effect keyed on `refreshKey`, which moves only on
 * the view's own write and `dataSource.onMutation`. A page action over raw HTTP
 * fires neither, so the rows were re-read only because `PageView` remounted
 * the page, and objectui#10519 removes that remount. The effect now names the
 * `useDataInvalidation` nonce for `schema.objectName`, the objectui#10623 /
 * #10778 / #10853 shape.
 *
 * Rendered through the real `SchemaRenderer` and this package's own
 * registration of `object-view`, in the page-region shape (`properties`). The
 * fake data source counts reads and implements no `onMutation`, as a page
 * action's raw HTTP write announces none. The inner views are stand-ins
 * registered in the real registry: this package does not depend on the
 * plugins that register them, and the rows are this component's read. Each
 * stand-in carries an instance id from a `useState` initializer, so a changed
 * id is a remount.
 */
import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup, screen, waitFor } from '@testing-library/react';
import { ComponentRegistry } from '@object-ui/core';
import {
  SchemaRenderer,
  SchemaRendererProvider,
  notifyDataChanged,
  useDataInvalidation,
} from '@object-ui/react';
// Module scope, not a hook: this import IS the registration of `object-view`.
import '../index';

const NON_GRID_TYPES = ['kanban', 'calendar', 'gallery', 'timeline', 'map'] as const;

let instanceSeq = 0;
function InnerViewStandIn({ schema, data }: { schema?: { type?: string }; data?: unknown }) {
  const [id] = React.useState(() => ++instanceSeq);
  return (
    <div
      data-testid="inner-view"
      data-type={schema?.type}
      data-instance={id}
      data-rows={Array.isArray(data) ? data.length : -1}
    />
  );
}
for (const t of NON_GRID_TYPES) ComponentRegistry.register(`object-${t}`, InnerViewStandIn as never);

/** The positive control: a bare reader of the view's object. */
function BusControl() {
  return <span data-testid="bus-control">{useDataInvalidation('deal')}</span>;
}

beforeEach(() => {
  // Best-effort metadata probes are not what these cases are about.
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => '{}' })));
});
afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

/** Answers one row more on every read, so a later delivery is distinguishable. */
function makeDataSource() {
  let answered = 0;
  return {
    find: vi.fn(async () => {
      answered += 1;
      const rows = Array.from({ length: answered }, (_, i) => ({ id: String(i + 1), name: `Deal ${i + 1}` }));
      return { data: rows, total: rows.length };
    }),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn(async () => ({ name: 'deal', fields: { name: { type: 'text' } } })),
  };
}

function mount(properties: Record<string, unknown>) {
  const ds = makeDataSource();
  render(
    <SchemaRendererProvider dataSource={ds as never}>
      <BusControl />
      <SchemaRenderer schema={{ type: 'object-view', properties } as never} />
    </SchemaRendererProvider>,
  );
  return ds;
}

const rest = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 60)));
const emit = (change: { objectName: string; recordId?: string }) =>
  act(async () => {
    notifyDataChanged(change);
  });
const inner = () => screen.getByTestId('inner-view');

async function mountAtRest(viewType: string) {
  const ds = mount({ objectName: 'deal', defaultViewType: viewType });
  await waitFor(() => expect(ds.find).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(inner().getAttribute('data-rows')).toBe('1'));
  await rest();
  expect(ds.find, 'one read on mount').toHaveBeenCalledTimes(1);
  return ds;
}

describe('object-view non-grid views re-read on the data-invalidation bus (objectui#10887)', () => {
  for (const viewType of NON_GRID_TYPES) {
    it(`${viewType}: an unscoped change ("*") re-reads once, in place`, async () => {
      const ds = await mountAtRest(viewType);
      const instance = inner().getAttribute('data-instance');

      await emit({ objectName: '*' });
      await rest();

      expect(screen.getByTestId('bus-control').textContent, 'control: the event never reached a subscriber').toBe('1');
      expect(ds.find, 'the rows never re-read after the bus reported a change').toHaveBeenCalledTimes(2);
      expect(ds.find.mock.calls[1][0]).toBe('deal');
      await waitFor(() => expect(inner().getAttribute('data-rows'), 'the re-read rows never reached the view').toBe('2'));
      expect(inner().getAttribute('data-type')).toBe(`object-${viewType}`);
      expect(inner().getAttribute('data-instance'), 'the re-read remounted the view').toBe(instance);
    });

    it(`${viewType}: a change to its own object re-reads once; an unrelated object does not`, async () => {
      const ds = await mountAtRest(viewType);

      await emit({ objectName: 'unrelated_object' });
      await rest();
      expect(ds.find, 'a change to another object re-read the rows').toHaveBeenCalledTimes(1);

      await emit({ objectName: 'deal', recordId: '1' });
      await rest();
      expect(ds.find, 'a change to its own object did not re-read the rows exactly once').toHaveBeenCalledTimes(2);
      await waitFor(() => expect(inner().getAttribute('data-rows')).toBe('2'));
    });
  }

  it('control: an object-view with no object reads nothing, on mount or on an invalidation', async () => {
    const ds = mount({ defaultViewType: 'kanban' });
    await rest();

    await emit({ objectName: '*' });
    await rest();

    expect(screen.getByTestId('bus-control').textContent).toBe('1');
    expect(ds.find).not.toHaveBeenCalled();
  });
});
