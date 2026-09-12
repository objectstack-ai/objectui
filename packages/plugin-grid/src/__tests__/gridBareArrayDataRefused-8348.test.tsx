/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#8348 — `object-grid` honours ONLY the `data` spelling its published
 * row declares, and for this block that is the `ViewData` OBJECT.
 *
 * ## The ruling, and this block's half of it
 *
 * Decision batch #83 (2026-09-08), maintainer verbatim 「8348 以协议为准」 — the
 * CONTRACT decides. The card was filed on `object-calendar`, whose row is
 * `z.array(...)` and which was honouring the `{ provider, items }` object
 * anyway. THIS block is the same rule pointing the other way: its row is the
 * object arm, and `getDataConfig` was lifting a bare array into
 * `{ provider: 'value', items }` before the shared ladder ever saw it.
 *
 * MEASURED on the `@objectstack/spec` this repo resolves (17.4.0),
 * `ComponentPropsMap['object-grid'].data` is the `ViewData` union and its own
 * description names the refusal:
 *
 *     "Data source binding (ViewDataSchema — discriminated on `provider`…).
 *      Static inline rows live at `{ provider: 'value', items: [...] }`; the
 *      bare-array shortcut is refused — see migration
 *      `object-grid-data-view-data-converged`"
 *
 * The block's own registration publishes the same arm
 * (`{ name: 'data', type: 'object' }`), and `gridDataInputContract.test.ts` has
 * pinned that DECLARATION since objectui#5090 while explicitly leaving the
 * renderer's array tolerance alone ("NOT asserted away here… it stays as
 * back-compat"). That sentence is what this card retires: the declaration pin
 * next door says what may be PUBLISHED, and this file says what is HONOURED.
 *
 * ⚠️ THE ACCEPTED COST, stated as rows 1-2: a stored grid authored
 * `data: [ …rows… ]` stops drawing those rows and queries its `objectName`
 * instead. Batch #83 accepts that under the standing 2026-08-27 posture — no
 * transition windows, no staged deprecation. The declared spellings for inline
 * rows — `data: { provider: 'value', items }` and the deprecated `staticData`
 * array — are unchanged, and rows 3-4 hold them still so this file cannot pass
 * by refusing everything.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
// Registers `object-grid` and its `view:grid` alias.
import '../index';

/** The rows an author put in the metadata. */
const AUTHORED = [{ id: 'a1', name: 'Authored row' }];
/** The row only a real query can put on screen — the discriminator. */
const FETCHED = [{ id: 'q1', name: 'Fetched by the query' }];

function makeAdapter() {
  return {
    find: vi.fn().mockResolvedValue({ data: FETCHED, total: 1 }),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getObjectSchema: vi.fn().mockResolvedValue({
      name: 'account',
      fields: { id: { type: 'text' }, name: { type: 'text' } },
    }),
  };
}

const BASE = { type: 'object-grid', objectName: 'account', columns: [{ field: 'name' }] };

function renderGrid(extra: Record<string, unknown>) {
  const adapter = makeAdapter();
  render(
    <SchemaRendererProvider dataSource={adapter as any}>
      <SchemaRenderer schema={{ ...BASE, ...extra } as any} />
    </SchemaRendererProvider>,
  );
  return adapter;
}

describe('object-grid refuses the bare-array `data` shorthand (objectui#8348)', () => {
  it('1. the authored rows are NOT drawn', async () => {
    const adapter = renderGrid({ data: AUTHORED });

    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    expect(screen.queryByText('Authored row')).toBeNull();
  });

  it('2. …and the block queries its object instead — the accepted cost, on screen', async () => {
    // Before this card `getDataConfig`'s `Array.isArray(schema.data)` head lifted
    // the array to `{ provider: 'value', items }` and the grid issued ZERO
    // queries. The head is gone, so the ladder falls through to `objectName`.
    const adapter = renderGrid({ data: AUTHORED });

    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    expect(adapter.find.mock.calls[0][0]).toBe('account');
    expect(await screen.findByText('Fetched by the query')).toBeTruthy();
  });

  it('3. ⛔ CONTROL: the DECLARED `{ provider: value, items }` form still draws, with no query', async () => {
    const adapter = renderGrid({ data: { provider: 'value', items: AUTHORED } });

    expect(await screen.findByText('Authored row')).toBeTruthy();
    expect(adapter.find).not.toHaveBeenCalled();
  });

  it('4. ⛔ CONTROL: the deprecated `staticData` array still draws, with no query', async () => {
    // `staticData` is this block's DECLARED array-shaped door for inline rows
    // ("Deprecated bare-array static-rows shortcut the renderer still reads" on
    // the spec row). The ruling retires the array under `data`, not this key —
    // and without this control, row 1 would also pass on a grid that had simply
    // stopped drawing inline rows at all.
    const adapter = renderGrid({ staticData: AUTHORED });

    expect(await screen.findByText('Authored row')).toBeTruthy();
    expect(adapter.find).not.toHaveBeenCalled();
  });

  it('5. the spec row is what all of the above is judged against — read, not restated', async () => {
    // Derived rather than asserted as a constant: a spec release that widened
    // `object-grid.data` to accept an array would turn this red, which is the
    // tripwire that says "re-derive the arm", not "delete this line".
    const { ComponentPropsMap } = await import('@objectstack/spec/ui');
    const row = ComponentPropsMap['object-grid'];

    expect(row.safeParse({ objectName: 'account', data: { provider: 'value', items: [] } }).success)
      .toBe(true);

    const refused = row.safeParse({ objectName: 'account', data: AUTHORED });
    expect(refused.success).toBe(false);
    if (!refused.success) {
      const issue = refused.error.issues.find((i: any) => i.path[0] === 'data');
      expect(issue?.code).toBe('invalid_type');
      expect((issue as any)?.expected).toBe('object');
    }
  });
});
