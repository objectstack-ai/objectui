/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10664 (the census row for `element:record_picker`) — the picker
 * re-reads its options when the `sort` it sends changes, and only then.
 *
 * Same defect as `element:repeater` in the sibling file: the fetch effect puts
 * `sort` on `$orderby` (the flat `properties.sort`, or a `dataSource` binding's
 * `sort`, which replaces it), but its dependency list named `filterKey` and no
 * sort. A changed sort kept the old option order until something else re-ran
 * the read. The sort is now keyed by CONTENT, the way `filterKey` keys the
 * filter.
 *
 * The CONTROL (an equal sort in a fresh array) is green before and after; it
 * goes red for a fix that keys on the array's identity (AGENTS.md #10).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import * as React from 'react';
import { render, act, cleanup, waitFor } from '@testing-library/react';
import { AdapterCtx, SchemaRenderer } from '@object-ui/react';
// Registers `element:record_picker` at module scope, not in a hook
// (object-ui/no-dynamic-import-in-test-hook, objectui#3010).
import '../../../renderers';

afterEach(cleanup);

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

const BY_NAME_ASC = [{ field: 'name', order: 'asc' }];
const BY_NAME_DESC = [{ field: 'name', order: 'desc' }];

type Where = 'properties' | 'binding';
type HostHandle = { setSort: (sort: unknown) => void };

/**
 * Holds the picker's `sort` as state and rebuilds the node on every change.
 * `where` puts it on the flat `properties.sort` or on a `dataSource` binding
 * (no `view`, so nothing waits on a saved-view read).
 */
const Host = React.forwardRef<HostHandle, { adapter: any; where: Where }>(function Host({ adapter, where }, ref) {
  const [sort, setSort] = React.useState<unknown>(BY_NAME_ASC);
  React.useImperativeHandle(ref, () => ({ setSort }), []);
  const schema = React.useMemo(
    () =>
      where === 'properties'
        ? { type: 'element:record_picker', id: 'picker', properties: { object: 'account', sort } }
        : { type: 'element:record_picker', id: 'picker', properties: {}, dataSource: { object: 'account', sort } },
    [sort, where],
  );
  return (
    <AdapterCtx.Provider value={adapter as never}>
      <SchemaRenderer schema={schema as never} />
    </AdapterCtx.Provider>
  );
});

function mount(where: Where) {
  const adapter = { find: vi.fn(async () => ({ data: [{ id: 'a1', name: 'Acme' }], total: 1 })), getObjectSchema: vi.fn() };
  const host = React.createRef<HostHandle>();
  render(<Host ref={host} adapter={adapter} where={where} />);
  return { adapter, host };
}

/** The `$orderby` of every read the picker issued, in order. */
const orderbys = (adapter: { find: { mock: { calls: any[][] } } }) =>
  adapter.find.mock.calls.map((c) => c[1]?.$orderby);

describe('element:record_picker keys its read on the sort it sends (objectui#10664)', () => {
  for (const where of ['properties', 'binding'] as const) {
    it(`SUBJECT: a changed sort on the ${where} re-reads, with the new \`$orderby\``, async () => {
      const { adapter, host } = mount(where);
      await waitFor(() => expect(adapter.find).toHaveBeenCalled());
      await settle();
      expect(orderbys(adapter)).toEqual([BY_NAME_ASC]);

      await act(async () => { host.current!.setSort(BY_NAME_DESC); });
      await settle();

      expect(orderbys(adapter), 'the changed sort never reached a read').toEqual([BY_NAME_ASC, BY_NAME_DESC]);
    });
  }

  it('CONTROL: an equal sort in a fresh array does not re-read', async () => {
    const { adapter, host } = mount('properties');
    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    await settle();
    const atRest = adapter.find.mock.calls.length;

    await act(async () => { host.current!.setSort([{ field: 'name', order: 'asc' }]); });
    await settle();

    expect(adapter.find.mock.calls.length, 'an equal sort re-read the options').toBe(atRest);
  });
});
