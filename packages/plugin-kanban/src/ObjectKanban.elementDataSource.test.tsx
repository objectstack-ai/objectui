/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * `object-kanban` consumes `PageComponentSchema.dataSource` (objectstack#6953).
 *
 * The board gates its fetch on `schema.objectName` and nothing mapped the spec's
 * `dataSource.object` onto it, so a board authored with the binding the spec
 * documents rendered its declared lanes with no cards, no request and no error.
 *
 * ## Why `columns` is NOT taken from the view
 *
 * A board's `columns` are its SWIMLANES (`{ id, title }` per `groupBy` value),
 * not a field projection. A saved view's `columns: ['name','rating']` written
 * there would render two empty lanes named after fields — a wrong answer that
 * looks like a rendered board. The mapping therefore takes `object`, `filter`
 * and `limit`, and the third test pins that the authored lanes survive.
 *
 * ## The row cap (objectui#4025)
 *
 * The board's cap was written `{ options: { $top: 100 } }`: `$filter` at the top
 * level where the adapters read it, the cap one level down under `options`, which
 * is not a `QueryParams` key and which no adapter in this repo reads. So the
 * board had no row cap at all, and `limit` stayed unmapped on the strength of a
 * "fixed window" that did not exist. The last describe block below pins the cap
 * as a real top-level `$top` and pins every source that can set it.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
import { DEFAULT_KANBAN_LIMIT } from './ObjectKanban';
// Registers `object-kanban` (and the ElementDataSourceGate wiring under test).
import './index';
// The lane titles asserted below render INSIDE `KanbanRenderer`'s `React.lazy`
// boundary. Importing the chunk at module scope bills the cold transform to the
// import phase (unbounded) instead of racing a `waitFor` budget under full
// parallelism — the objectui#3010 rule, same specifier as `index.tsx`'s factory
// so ESM's module cache makes that factory resolve immediately.
import './KanbanImpl';

const HOT_VIEW = {
  name: 'hot',
  label: 'Hot accounts',
  columns: ['name', 'rating'],
  filter: [['rating', '=', 'hot']],
  sort: [{ field: 'name', order: 'desc' }],
  pagination: { pageSize: 7 },
};

const LANES = [
  { id: 'open', title: 'Open' },
  { id: 'won', title: 'Won' },
];

function makeAdapter(listViews: Record<string, unknown> = { hot: HOT_VIEW }) {
  return {
    find: vi.fn().mockResolvedValue({ data: [{ id: '1', name: 'Acme', status: 'open' }] }),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn().mockResolvedValue({
      name: 'account',
      fields: { name: { type: 'text' }, status: { type: 'text' }, rating: { type: 'text' } },
      listViews,
    }),
  };
}

const renderBlock = (schema: Record<string, unknown>, adapter: ReturnType<typeof makeAdapter>) =>
  render(
    <SchemaRendererProvider dataSource={adapter as any}>
      <SchemaRenderer schema={schema as any} />
    </SchemaRendererProvider>,
  );

describe('object-kanban — dataSource: { object, view } (objectstack#6953)', () => {
  it('queries the bound object with the saved view’s filter', async () => {
    const adapter = makeAdapter();
    renderBlock(
      {
        type: 'object-kanban',
        groupBy: 'status',
        columns: LANES,
        dataSource: { object: 'account', view: 'hot' },
      },
      adapter,
    );

    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    const [object, params] = adapter.find.mock.calls[0] as [string, any];
    expect(object).toBe('account');
    expect(params.$filter).toEqual([['rating', '=', 'hot']]);
  });

  it('keeps the authored SWIMLANES — the view’s field list is not a lane list', async () => {
    const adapter = makeAdapter();
    const { container } = renderBlock(
      {
        type: 'object-kanban',
        groupBy: 'status',
        columns: LANES,
        dataSource: { object: 'account', view: 'hot' },
      },
      adapter,
    );

    // Lane titles, not field names: `rating` must never become a lane on a
    // board. `waitFor` because the lanes render past a Suspense boundary.
    await waitFor(() => expect(container.textContent).toContain('Open'));
    expect(container.textContent).toContain('Won');
    expect(container.textContent).not.toContain('rating');
  });

  it('reports an unresolvable `view` instead of fetching the whole object', async () => {
    const adapter = makeAdapter();
    const { container } = renderBlock(
      {
        type: 'object-kanban',
        groupBy: 'status',
        columns: LANES,
        dataSource: { object: 'account', view: 'nope' },
      },
      adapter,
    );

    await waitFor(() =>
      expect(container.querySelector('[data-testid="object-kanban-datasource-error"]')).not.toBeNull(),
    );
    expect(adapter.find).not.toHaveBeenCalled();
  });

  it('leaves a board with NO dataSource querying its own object and filter', async () => {
    const adapter = makeAdapter();
    renderBlock(
      {
        type: 'object-kanban',
        objectName: 'account',
        groupBy: 'status',
        columns: LANES,
        filter: [['owner', '=', 'me']],
      },
      adapter,
    );

    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    const [object, params] = adapter.find.mock.calls[0] as [string, any];
    expect(object).toBe('account');
    expect(params.$filter).toEqual([['owner', '=', 'me']]);
  });
});

/**
 * The row cap (objectui#4025).
 *
 * Every assertion here also pins the ABSENCE of `params.options`: the defect was
 * not a wrong number, it was a right number written where nothing reads it, and
 * a test that only checked `$top` would stay green if someone re-added the dead
 * nesting beside it.
 */
describe('object-kanban — the row cap reaches the wire (objectui#4025)', () => {
  const firstQuery = async (adapter: ReturnType<typeof makeAdapter>) => {
    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    return adapter.find.mock.calls[0] as [string, any];
  };

  it('caps an uncapped board at the default window, as a REAL $top', async () => {
    const adapter = makeAdapter();
    renderBlock(
      { type: 'object-kanban', objectName: 'account', groupBy: 'status', columns: LANES },
      adapter,
    );

    const [object, params] = await firstQuery(adapter);
    expect(object).toBe('account');
    // The number is the one the board always intended; it just reaches the
    // adapter now (`convertQueryParams` in `@object-ui/data-objectstack` and
    // `ApiDataSource` both read `params.$top`, neither reads `params.options`).
    expect(params.$top).toBe(DEFAULT_KANBAN_LIMIT);
    expect(params.$top).toBe(100);
    expect(params.options).toBeUndefined();
  });

  it('honours a `limit` authored directly on the block', async () => {
    const adapter = makeAdapter();
    renderBlock(
      { type: 'object-kanban', objectName: 'account', groupBy: 'status', columns: LANES, limit: 20 },
      adapter,
    );

    const [, params] = await firstQuery(adapter);
    expect(params.$top).toBe(20);
    expect(params.options).toBeUndefined();
  });

  it('takes a named view’s page size as the board’s window', async () => {
    const adapter = makeAdapter();
    renderBlock(
      {
        type: 'object-kanban',
        groupBy: 'status',
        columns: LANES,
        dataSource: { object: 'account', view: 'hot' },
      },
      adapter,
    );

    const [object, params] = await firstQuery(adapter);
    expect(object).toBe('account');
    // `hot` declares `pagination: { pageSize: 7 }` — a view's row cap.
    expect(params.$top).toBe(7);
    // The view's filter still arrives: the cap did not displace it.
    expect(params.$filter).toEqual([['rating', '=', 'hot']]);
    expect(params.options).toBeUndefined();
  });

  it('lets the binding’s own `limit` override the view’s page size', async () => {
    const adapter = makeAdapter();
    renderBlock(
      {
        type: 'object-kanban',
        groupBy: 'status',
        columns: LANES,
        dataSource: { object: 'account', view: 'hot', limit: 3 },
      },
      adapter,
    );

    const [, params] = await firstQuery(adapter);
    // `limit` overrides rather than combines — the binding is the narrower,
    // more local statement (see `composeElementDataSource`).
    expect(params.$top).toBe(3);
    expect(params.options).toBeUndefined();
  });
});

/**
 * objectui#8071 — the MEMBER shape of `object-kanban`.`dataSource`.
 *
 * ## Why this block was added to a pre-existing file
 *
 * `dataSource` is not written by this block at all: `Registry.register` INJECTS
 * `ELEMENT_DATA_SOURCE_INPUT` into every registration that wraps the runtime
 * gate, so the declaration says `type: 'object'` and nothing whatever about
 * members. The member contract is therefore entirely the read site, and the
 * read site is one line of this package —
 * `OBJECT_KANBAN_DATA_SOURCE = { filter: true, limit: 'limit' }` — read by
 * `ElementDataSourceGate` in `@object-ui/react`.
 *
 * The three describe blocks above were read end to end before being credited as
 * the pin's base. They already cover `object` (the bound object is queried),
 * `view` (its filter and page size arrive, an unresolvable one REPORTS rather
 * than widening) and the deliberate non-mapping of `columns`. They do not cover
 * the rest of the binding's five members, and the five are NOT alike: two are
 * mapped, one is mapped and then contested by two other sources, and two are
 * deliberately inert. That is what this block adds.
 *
 * | member    | disposition on THIS block                                      |
 * |-----------|----------------------------------------------------------------|
 * | `object`  | mapped, and it OUTRANKS an authored `objectName`               |
 * | `view`    | the baseline every other member is contested against           |
 * | `filter`  | mapped, and AND-combined with the block's own `filter` too     |
 * | `limit`   | mapped onto the block's `limit`; binding > block > view         |
 * | `sort`    | ⛔ NOT mapped — the board has no `$orderby` read site           |
 *
 * ⚠️ The inert member is the one a pin must state loudest. `sort` is a member
 * the spec's binding declares and this block silently ignores; without a row
 * saying so, a later contributor "completing the mapping" would wire it onto a
 * key nothing reads and the pin would stay green.
 */
describe('object-kanban — the binding’s five members, each with its disposition (objectui#8071)', () => {
  const firstQuery = async (adapter: ReturnType<typeof makeAdapter>) => {
    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    return adapter.find.mock.calls[0] as [string, any];
  };

  it('⭐ `object` OUTRANKS an `objectName` the board authored itself', async () => {
    // `next[objectKey] = composed.object` is UNCONDITIONAL. The `??=` spelling
    // a contributor would write to "not clobber the author" would leave a
    // rebound board querying the old object with the same lanes, the same
    // groupBy and no diagnostic — invisible whenever both objects exist.
    const adapter = makeAdapter();
    renderBlock(
      {
        type: 'object-kanban',
        objectName: 'contact',
        groupBy: 'status',
        columns: LANES,
        dataSource: { object: 'account' },
      },
      adapter,
    );

    const [object] = await firstQuery(adapter);
    expect(object).toBe('account');
  });

  it('⭐ `filter` is ADDITIONAL to the board’s OWN filter, not a replacement', async () => {
    // `mergeFilterNodes(base.filter, composed.filter)`: the block's own
    // `schema.filter` survives and the binding narrows it further. A mapping
    // that assigned instead of merging would silently WIDEN the board past the
    // rows its own filter admitted.
    const adapter = makeAdapter({});
    renderBlock(
      {
        type: 'object-kanban',
        groupBy: 'status',
        columns: LANES,
        filter: [['owner', '=', 'me']],
        dataSource: { object: 'account', filter: [['rating', '=', 'hot']] },
      },
      adapter,
    );

    const [, params] = await firstQuery(adapter);
    // ⚠️ MEASURED, not predicted: each source keeps its own RULE-LIST nesting
    // under the `and`, so the combined node is `['and', <list>, <list>]` and
    // not a flattened three-element node. A pin that asserted the flattened
    // spelling would be asserting a shape this repo does not produce.
    expect(params.$filter).toEqual(['and', [['owner', '=', 'me']], [['rating', '=', 'hot']]]);
  });

  it('a binding filter with NO view and no board filter passes through verbatim', async () => {
    // The lone-source case: combining is what forces the AST lowering, so a
    // single source must keep the shape it was authored in.
    const adapter = makeAdapter({});
    renderBlock(
      {
        type: 'object-kanban',
        groupBy: 'status',
        columns: LANES,
        dataSource: { object: 'account', filter: [['rating', '=', 'hot']] },
      },
      adapter,
    );

    const [, params] = await firstQuery(adapter);
    expect(params.$filter).toEqual([['rating', '=', 'hot']]);
  });

  it('⛔ `sort` is INERT on this block — it reaches no query key at all', async () => {
    // The board groups cards into lanes and declares no ordering. Mapping this
    // member onto something plausible would re-create the defect the wiring
    // removed (a value accepted and dropped) one layer deeper, so it stays
    // unmapped — and this row is what makes that a decision rather than an
    // omission.
    const adapter = makeAdapter({});
    renderBlock(
      {
        type: 'object-kanban',
        groupBy: 'status',
        columns: LANES,
        dataSource: { object: 'account', sort: [{ field: 'name', order: 'desc' }], limit: 4 },
      },
      adapter,
    );

    const [, params] = await firstQuery(adapter);
    expect(params.$orderby).toBeUndefined();
    expect(params.sort).toBeUndefined();
    // LIT CONTROL, same binding and same query: a member that IS mapped moved,
    // so the two negatives above are about `sort` and not about a binding that
    // never arrived.
    expect(params.$top).toBe(4);
  });

  it('⭐ `limit` — the binding beats the block, and the block beats the VIEW', async () => {
    // Two different branches of one rule, and either alone is consistent with a
    // renderer that simply takes the last writer.
    const authored = makeAdapter();
    renderBlock(
      {
        type: 'object-kanban',
        groupBy: 'status',
        columns: LANES,
        limit: 11,
        // `hot` declares `pagination: { pageSize: 7 }`.
        dataSource: { object: 'account', view: 'hot' },
      },
      authored,
    );
    const [, authoredParams] = await firstQuery(authored);
    expect(authoredParams.$top).toBe(11);

    const bound = makeAdapter();
    renderBlock(
      {
        type: 'object-kanban',
        groupBy: 'status',
        columns: LANES,
        limit: 11,
        dataSource: { object: 'account', view: 'hot', limit: 3 },
      },
      bound,
    );
    const [, boundParams] = await firstQuery(bound);
    expect(boundParams.$top).toBe(3);
  });
});
