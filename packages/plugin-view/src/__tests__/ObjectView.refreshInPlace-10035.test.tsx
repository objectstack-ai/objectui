/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10035 — a write refreshes the view's DATA; it does not rebuild the
 * view (AGENTS.md #8's corollary).
 *
 * ## The defect this pins
 *
 * `renderContent` keyed every view it rendered on
 * `objectName-view-type-refreshKey`, and `refreshKey` moves on every write
 * this component hears about (`onMutation`, a form save, a delete). So each
 * write REMOUNTED the view: a fresh instance, every piece of component state in
 * it gone. The rows were refetched too — the non-grid fetch effect names
 * `refreshKey` — which is why nothing looked broken: the damage was the
 * remount, not a missing refetch.
 *
 * ## The two halves, and which world each one can fail in
 *
 * Each in-place case asserts BOTH:
 *   (a) the rendered view is the SAME instance after the write, and
 *   (b) it received the refetched rows.
 * Against the pre-fix source (a) is the red half; (b) stays green there,
 * because that world refetched as well — through the remount. (b) is the half
 * that goes red if the refresh SIGNAL is lost (the counter dropped from the
 * key AND from the fetch effect), which is the regression a naive "remove the
 * key" fix would ship.
 *
 * ## The remount that stays, pinned as the refresh it still is
 *
 * `gantt`, `chart` and the grid branch render a component that fetches for
 * itself and reads nothing that moves on a write, so for them a remount is
 * still the only way a write shows up (`REMOUNT_TO_REFRESH_VIEW_TYPES`). Those
 * cases assert the fresh instance. When one of those renderers gains an
 * in-place refresh input, its case moves to the in-place table — it is red
 * until someone does that deliberately, never silently green.
 *
 * The stand-ins below render the props a real data-fed renderer reads (`data`)
 * and carry an instance id from a `useState` initializer, which runs once per
 * mount: a changed id IS a remount.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { ObjectView } from '../ObjectView';
import type { ObjectViewSchema, DataSourceMutationEvent } from '@object-ui/types';

let instanceSeq = 0;

function useInstanceId(): number {
  const [id] = React.useState(() => ++instanceSeq);
  return id;
}

vi.mock('@object-ui/react', async (importOriginal) => {
  const ReactMod = await import('react');
  function ViewStandIn({ schema, data }: any) {
    const id = useInstanceId();
    return (
      <div
        data-testid="rendered-view"
        data-type={schema?.type}
        data-instance={id}
        data-rows={Array.isArray(data) ? data.length : -1}
      />
    );
  }
  return {
    ...(await importOriginal<Record<string, unknown>>()),
    SchemaRenderer: ViewStandIn,
    SchemaRendererContext: ReactMod.createContext(null),
    subscribeDataChanges: () => () => {},
    notifyDataChanged: () => {},
  };
});
vi.mock('@object-ui/plugin-grid', async (importOriginal) => {
  function GridStandIn() {
    const id = useInstanceId();
    return <div data-testid="rendered-view" data-type="object-grid" data-instance={id} data-rows={-1} />;
  }
  return {
    ...(await importOriginal<Record<string, unknown>>()),
    ObjectGrid: GridStandIn,
  };
});
vi.mock('@object-ui/plugin-form', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ObjectForm: () => <div data-testid="object-form" />,
}));

/**
 * A DataSource that answers one row, then two — so the second delivery is
 * distinguishable from the first — and hands its `onMutation` subscribers back
 * to the test, so a write can be announced the way a real adapter does.
 */
function makeDataSource() {
  const subscribers: ((event: DataSourceMutationEvent) => void)[] = [];
  let answered = 0;
  const find = vi.fn(async () => {
    answered += 1;
    const rows = Array.from({ length: answered }, (_, i) => ({ id: String(i + 1), name: `Row ${i + 1}` }));
    return { data: rows, total: rows.length };
  });
  const ds: any = {
    find,
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn().mockResolvedValue({ name: 'task', fields: {} }),
    onMutation: vi.fn((cb: (event: DataSourceMutationEvent) => void) => {
      subscribers.push(cb);
      return () => {};
    }),
  };
  return {
    ds,
    find,
    write: async () => {
      await act(async () => {
        subscribers.forEach((cb) => cb({ type: 'create', resource: 'task', id: 'new' }));
      });
    },
  };
}

function renderView(type: string, ds: unknown) {
  render(
    <ObjectView
      schema={{ type: 'object-view', objectName: 'task' } as ObjectViewSchema}
      views={[{ id: 'v', label: 'V', type } as never]}
      dataSource={ds as never}
    />,
  );
}

const view = () => screen.getByTestId('rendered-view');

beforeEach(() => {
  cleanup();
  instanceSeq = 0;
});

describe('ObjectView refreshes a data-fed view in place after a write (objectui#10035)', () => {
  // Every non-grid type whose renderer draws the `data` this component fetches
  // (`tree` re-queries when that array changes). `tree` is host-only
  // (objectui#5321), which is why every case goes through a `views` prop.
  it.each(['kanban', 'calendar', 'gallery', 'timeline', 'map', 'tree'])(
    '%s: the same view instance receives the refetched rows',
    async (type) => {
      const { ds, find, write } = makeDataSource();
      renderView(type, ds);
      await waitFor(() => expect(view().dataset.rows).toBe('1'));
      const before = view().dataset.instance;

      await write();

      await waitFor(() => expect(find).toHaveBeenCalledTimes(2));
      await waitFor(() =>
        expect(
          view().dataset.rows,
          '(b) The view never received the rows refetched after the write. The refresh\n'
            + 'signal (`refreshKey`) must still reach the non-grid fetch effect once it\n'
            + 'no longer rides in the key.',
        ).toBe('2'),
      );
      expect(
        view().dataset.instance,
        '(a) The write REMOUNTED the view. `refreshKey` is back in its `key`, so every\n'
          + 'save throws the view\'s component state away (AGENTS.md #8: refresh data,\n'
          + 'don\'t rebuild UI). Only `REMOUNT_TO_REFRESH_VIEW_TYPES` may keep it.',
      ).toBe(before);
    },
  );
});

describe('the views with no in-place refetch path still show a write — by remount (objectui#10035)', () => {
  it.each([
    ['gantt', 'object-gantt'],
    ['chart', 'object-chart'],
    ['grid', 'object-grid'],
  ])('%s: a write mounts a fresh instance', async (type, renderedType) => {
    const { ds, write } = makeDataSource();
    renderView(type, ds);
    await waitFor(() => expect(view().dataset.type).toBe(renderedType));
    const before = view().dataset.instance;

    await write();

    await waitFor(() =>
      expect(
        view().dataset.instance,
        `The ${type} view was NOT remounted after a write. Its renderer fetches for\n`
          + 'itself and reads no refresh input, so without the remount it silently keeps\n'
          + 'showing the pre-write rows. Remove it from the remount set only together\n'
          + 'with a change that makes the renderer refetch in place.',
      ).not.toBe(before),
    );
  });
});
