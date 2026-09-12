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
 * ## ⛔ THE TWO-CARRIER TRAP, MEASURED ON THIS BLOCK — read this before reading
 * the rows
 *
 * The removal above is real at the LADDER and is NOT, on its own, an
 * end-to-end behaviour change for an authored node. `SchemaRenderer` spreads
 * every non-metadata node key as a React prop, and `plugin-grid/src/index.tsx`
 * forwards `{...rest}` to the component — so an authored `data` ARRAY arrives
 * TWICE: as `schema.data`, where `getDataConfig` used to lift it, AND as the
 * `data` PROP, which `ObjectGrid` lifts to `{ provider: 'value', items }` at
 * HIGHER priority than the ladder (`passedData`, the channel a host such as
 * `ListView` legitimately uses to hand down rows it pre-fetched).
 *
 * MEASURED, not reasoned: the first version of this file asserted that a node
 * authored `data: [ …rows… ]` stops drawing and queries its object instead.
 * Rows 1-2 went RED — no query was issued and the rows were on screen — because
 * the props channel had lifted the array. That is the same two-carrier
 * arrangement `ObjectCalendar.recordSourceMembers-8314.test.tsx` documents one
 * package over, and the reason this file states the verdict per CARRIER:
 *
 *  - at the ladder (rows 1-2): the array is no longer a record source. Measured
 *    on the component directly, with NO `data` prop, which is the only way to
 *    observe the ladder alone.
 *  - through `SchemaRenderer` (row 3): the array still draws, from the props
 *    channel. ⛔ This is NOT the ruling failing — it is a different carrier,
 *    indistinguishable at the component boundary from a host handing down
 *    pre-fetched rows, and collapsing the two is outside objectui#8348. It is
 *    reported on the card rather than changed in passing.
 *
 * ⇒ the accepted cost lands on `object-calendar`, where the off-arm spelling had
 * exactly ONE carrier (`index.tsx`'s `resolveExternalData` keeps `data` only
 * when `Array.isArray`, so the config OBJECT never reaches the props channel).
 * On this block the ruling removes the second read, not the last one.
 *
 * The declared spellings for inline rows — `data: { provider: 'value', items }`
 * and the deprecated `staticData` array — are unchanged, and rows 4-5 hold them
 * still so this file cannot pass by refusing everything.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
import { ObjectGrid } from '../ObjectGrid';
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
  it('1. at the LADDER: a bare array under `data` is no longer a record source', async () => {
    // The component directly, with NO `data` prop — the only lens through which
    // the ladder's verdict is observable at all (see the two-carrier note above).
    const adapter = makeAdapter();
    render(
      <ObjectGrid
        schema={{ ...BASE, data: AUTHORED } as any}
        dataSource={adapter as any}
      />,
    );

    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    expect(screen.queryByText('Authored row')).toBeNull();
  });

  it('2. …and the ladder falls through to `objectName`, so the block queries', async () => {
    // Before this card `getDataConfig`'s `Array.isArray(schema.data)` head lifted
    // the array to `{ provider: 'value', items }` and this render issued ZERO
    // queries.
    const adapter = makeAdapter();
    render(
      <ObjectGrid
        schema={{ ...BASE, data: AUTHORED } as any}
        dataSource={adapter as any}
      />,
    );

    await waitFor(() => expect(adapter.find).toHaveBeenCalled());
    expect(adapter.find.mock.calls[0][0]).toBe('account');
    expect(await screen.findByText('Fetched by the query')).toBeTruthy();
  });

  it('3. ⛔ REPORTED, NOT CHANGED: through `SchemaRenderer` the array still draws, from the PROPS channel', async () => {
    // The measurement that corrected this file's own first draft. The authored
    // key reaches the component twice, and the surviving carrier is the one a
    // host legitimately uses — so the node still renders its rows and issues no
    // query. Removing THAT carrier would take the host path with it and is
    // outside objectui#8348's scope; it is reported on the card.
    const adapter = renderGrid({ data: AUTHORED });

    expect(await screen.findByText('Authored row')).toBeTruthy();
    expect(adapter.find).not.toHaveBeenCalled();
  });

  it('4. ⛔ CONTROL: the DECLARED `{ provider: value, items }` form still draws, with no query', async () => {
    const adapter = renderGrid({ data: { provider: 'value', items: AUTHORED } });

    expect(await screen.findByText('Authored row')).toBeTruthy();
    expect(adapter.find).not.toHaveBeenCalled();
  });

  it('5. ⛔ CONTROL: the deprecated `staticData` array still draws, with no query', async () => {
    // `staticData` is this block's DECLARED array-shaped door for inline rows
    // ("Deprecated bare-array static-rows shortcut the renderer still reads" on
    // the spec row). The ruling retires the array under `data`, not this key —
    // and without this control, rows 1-2 would also pass on a grid that had
    // simply stopped drawing inline rows at all.
    const adapter = renderGrid({ staticData: AUTHORED });

    expect(await screen.findByText('Authored row')).toBeTruthy();
    expect(adapter.find).not.toHaveBeenCalled();
  });

  it('6. the spec row is what all of the above is judged against — read, not restated', async () => {
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
