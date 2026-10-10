/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * objectui#6152 round 10 — `defaultFilters` takes the `object-grid` row's
 * `ViewFilterRule` array, and the real `ObjectGrid` honours it exactly as it honours
 * the same array written as `filter`.
 *
 * `@object-ui/types` now declares `ObjectGridSchema.defaultFilters` as the row's own
 * member (it was `Record<string, any>`). No reader changed: `ObjectGrid` lowers the
 * legacy slot through the same `toFilterNode` sink as the canonical one, so a rule
 * array there already reached the wire as AST. This file measures that through the
 * registered renderer and a `ValueDataSource` that APPLIES the `$filter` it receives,
 * so "the same rows" is a reading of what the grid draws, not only of what it sends.
 *
 * The fixtures are typed by the shape legacy metadata carries (objectui#12093). The
 * declaration follows the `object-grid` row by reference: the rule array on the
 * installed `@objectstack/spec`, a retired-key tombstone on objectstack `main`
 * (objectstack#11509), which no current document can author. The grid still READS the
 * key for metadata written before that retirement, and that read is what this file
 * pins, so a `defaultFilters` node is built by `withDefaultFilters` below from the `filter` rule
 * array, the shape the key carries on both specs. Which spec says the rule array is
 * the declaration is `grid-default-filters-gantt-map-filter-round10-6152.test.ts`'s
 * question in `@object-ui/types`, answered there against the row.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import type { ObjectGridSchema } from '@object-ui/types';
import { ValueDataSource } from '@object-ui/core';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
// Registers `object-grid`.
import '../index';

const ROWS = [
  { id: '1', name: 'Acme', status: 'open' },
  { id: '2', name: 'Beta', status: 'closed' },
  { id: '3', name: 'Cyan', status: 'open' },
];
const NAMES = ROWS.map((r) => r.name);

type Rules = NonNullable<ObjectGridSchema['filter']>;
const OPEN: Rules = [{ field: 'status', operator: 'equals', value: 'open' }];
const CLOSED: Rules = [{ field: 'status', operator: 'equals', value: 'closed' }];

/** An adapter whose `find` answers through a `ValueDataSource`, so `$filter` is applied. */
function makeAdapter() {
  const rows = new ValueDataSource({ items: ROWS, idField: 'id' });
  return {
    find: vi.fn((resource: string, params: Record<string, unknown>) => rows.find(resource, params as never)),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn().mockResolvedValue({
      name: 'account',
      fields: { id: { type: 'text' }, name: { type: 'text' }, status: { type: 'text' } },
    }),
  };
}

/** Render the node; return the `$filter` its first query sent and the names it drew. */
async function draw(node: ObjectGridSchema): Promise<{ $filter: unknown; drawn: string[] }> {
  const adapter = makeAdapter();
  const { unmount } = render(
    <SchemaRendererProvider dataSource={adapter as never}>
      <SchemaRenderer schema={node} />
    </SchemaRendererProvider>,
  );
  await waitFor(() => expect(adapter.find).toHaveBeenCalled());
  const params = (adapter.find.mock.calls[0] as [string, Record<string, unknown>])[1];
  const answer = await adapter.find.mock.results[0].value;
  const expected = (answer as { data: Array<{ name: string }> }).data.map((r) => r.name);
  // Wait until the grid has drawn what the source answered, then read the DOM.
  if (expected.length > 0) await screen.findByText(expected[0]);
  const drawn = NAMES.filter((name) => screen.queryByText(name) !== null);
  unmount();
  return { $filter: params.$filter, drawn };
}

const node = (extra: Partial<ObjectGridSchema>): ObjectGridSchema => ({
  type: 'object-grid',
  objectName: 'account',
  columns: [{ field: 'name' }],
  ...extra,
});

/** A node carrying the legacy `defaultFilters` (see the header): written as legacy metadata has it. */
const withDefaultFilters = (defaultFilters: Rules, extra: Partial<ObjectGridSchema> = {}): ObjectGridSchema =>
  ({ ...node(extra), defaultFilters }) as unknown as ObjectGridSchema;

describe('objectui#6152 round 10 — a `defaultFilters` rule array draws what the same `filter` draws', () => {
  it('CONTROL: with neither key, every row is drawn and no `$filter` goes out', async () => {
    const { $filter, drawn } = await draw(node({}));
    expect($filter).toBeUndefined();
    expect(drawn).toEqual(['Acme', 'Beta', 'Cyan']);
  });

  it('`defaultFilters: [rule]` sends the lowered AST and draws the matching rows', async () => {
    const { $filter, drawn } = await draw(withDefaultFilters(OPEN));
    expect($filter).toEqual([['status', 'equals', 'open']]);
    expect(drawn).toEqual(['Acme', 'Cyan']);
  });

  it('the same array written as `filter` sends the same `$filter` and draws the same rows', async () => {
    const legacy = await draw(withDefaultFilters(OPEN));
    const canonical = await draw(node({ filter: OPEN }));
    expect(legacy).toEqual(canonical);
  });

  it('LIT CONTROL: a different rule array moves both readings, so the equality above can fail', async () => {
    const { $filter, drawn } = await draw(withDefaultFilters(CLOSED));
    expect($filter).toEqual([['status', 'equals', 'closed']]);
    expect(drawn).toEqual(['Beta']);
  });

  it('CONTROL: written both ways, `filter` still wins', async () => {
    const { $filter, drawn } = await draw(withDefaultFilters(CLOSED, { filter: OPEN }));
    expect($filter).toEqual([['status', 'equals', 'open']]);
    expect(drawn).toEqual(['Acme', 'Cyan']);
  });
});
