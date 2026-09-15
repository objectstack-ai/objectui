/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * `record:related_list.columns` — the MEMBER shape the renderer reads
 * (objectui#8068 / objectui#8071).
 *
 * ## Why this key is the exact defect objectui#8068 was built for
 *
 * The registration declares `{ name: 'columns', type: 'array', of: 'string' }`
 * — members are STRINGS — and the renderer reads them as objects in four more
 * spellings. That is the `page:header.actions` / objectstack#11592 shape word
 * for word: a declaration that says `of: 'string'` while the code folds
 * `{ field }`, `{ name }`, `{ fieldName }` and `{ key }`. `of` carries a member
 * KIND and nothing finer (objectui#8067), so nothing in the published surface
 * can state the union — which is why it is pinned here, against the read site.
 *
 * ## The read site this file drives
 *
 * `renderers/record-related-list.tsx`'s `colName`:
 *
 *     columnIdentity(entry) || (entry && typeof entry === 'object' ? entry.key : null) || null
 *
 * and it runs over EVERY member whenever the block filters columns. That fold
 * is the block's own member read — `columnIdentity` (objectui#3104) supplies
 * the canonical-first `field` / `name` / `fieldName` resolution shared with the
 * rest of the repo, and `key` is a tail fallback this block adds on top.
 *
 * A member that resolves to NONE of them is excluded from the filtered set
 * (objectui#8793): the fold fails closed, because an entry it cannot name is an
 * entry it cannot check against the field-security allow-list, while
 * `RelatedList` would render it anyway through the table library's own key.
 *
 * The end-to-end half — an object column reaching the screen with VALUES rather
 * than a header over blank cells — is pinned next door in
 * `RelatedList.columnIdentityAccessor.test.tsx` (objectui#5022), which renders
 * the real `data-table`. This file pins the BLOCK's fold, which that file
 * cannot see: it drives `RelatedList` directly and never runs `colName`.
 *
 * ## ⚠️ The probe key, stated rather than smuggled
 *
 * `redactFields` is the channel used below, because the block folds members
 * ONLY when it filters — with nothing to filter, `columns` is handed down by
 * reference and no member is ever read. `redactFields` and
 * `enforceFieldSecurity` are renderer-only keys: measured against
 * `RecordRelatedListProps` (`@objectstack/spec`), whose top-level keys are
 * actions/add/aria/columns/filter/limit/objectName/relationshipField/
 * relationshipValueField/showViewAll/sort/title, they are on NEITHER the spec
 * nor this block's `inputs`. They are used here as an instrument for a fold
 * that is otherwise unobservable, never as evidence that they are an authoring
 * surface — the first assertion below states that so a later reader cannot take
 * this file as licensing them.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import * as React from 'react';
import { RecordContextProvider } from '@object-ui/react';
import { ComponentRegistry, columnIdentity } from '@object-ui/core';
import { RecordRelatedListRenderer } from '../renderers/record-related-list';
import '../index';

// Capture the column array the BLOCK hands down — the output of its own fold.
const h = vi.hoisted(() => ({ captured: null as any }));
vi.mock('../RelatedList', () => ({
  RelatedList: (props: any) => {
    h.captured = props;
    return <div data-testid="related-list" />;
  },
}));

const makeDS = () => ({
  find: vi.fn(async () => []),
  getObjectSchema: vi.fn(async (name: string) => ({ name, fields: {} })),
});

/** Render the block with only `columns` (and the redact probe) varying. */
async function columnsAfterFold(columns: unknown[], redactFields?: string[]): Promise<any[]> {
  // Unmount whatever a previous call in this test mounted, and clear the
  // capture, so `waitFor` below can never resolve on the PREVIOUS render's
  // props — several cases here render twice and compare the two results.
  cleanup();
  h.captured = null;
  render(
    <RecordContextProvider objectName="account" recordId="ACC-1" dataSource={makeDS() as any}>
      <RecordRelatedListRenderer
        schema={
          {
            objectName: 'contact',
            relationshipField: 'account',
            columns,
            ...(redactFields ? { redactFields } : {}),
          } as any
        }
      />
    </RecordContextProvider>,
  );
  await waitFor(() => expect(h.captured).toBeTruthy());
  return h.captured.columns;
}

/**
 * Does the block resolve this member to the identity `status`? Measured by
 * redacting `status` and seeing the member go — with the CONTROL in the same
 * call, so a member that vanished for any other reason cannot read as a
 * resolution.
 */
async function resolvesToStatus(member: unknown): Promise<boolean> {
  const kept = await columnsAfterFold([member], ['some_other_field']);
  expect(kept, 'control: the member survives when a DIFFERENT field is redacted').toEqual([member]);
  h.captured = null;
  const dropped = await columnsAfterFold([member], ['status']);
  return dropped.length === 0;
}

const input = (name: string) =>
  ComponentRegistry.getConfig('record:related_list')?.inputs?.find((i) => i.name === name);

beforeEach(() => {
  h.captured = null;
});

describe('record:related_list — the `columns` MEMBER shape the renderer reads (objectui#8068)', () => {
  it('THE HOLE — the declaration says members are STRINGS, and the code reads objects', () => {
    // Both halves in one assertion, because the pin is the GAP between them and
    // either half alone is unremarkable. If a later change makes the declaration
    // honest, this reddens and the pins below must be re-read rather than
    // assumed still current.
    expect(input('columns')?.type).toBe('array');
    expect(input('columns')?.of).toBe('string');
    // …and the shared resolver this block folds through accepts object members.
    expect(columnIdentity({ field: 'status' })).toBe('status');
  });

  it('resolves the spec-canonical `{ field }` member', async () => {
    expect(await resolvesToStatus({ field: 'status', label: 'Status' })).toBe(true);
  });

  it('resolves the legacy `{ name }` and `{ fieldName }` members', async () => {
    // objectui-side legacy that stored host metadata can still carry; the fold
    // accepts them and the identity ratchet counts them.
    expect(await resolvesToStatus({ name: 'status' })).toBe(true);
    h.captured = null;
    expect(await resolvesToStatus({ fieldName: 'status' })).toBe(true);
  });

  it('resolves a bare STRING member — the one shape the declaration admits', async () => {
    expect(await resolvesToStatus('status')).toBe(true);
  });

  it("resolves `{ key }`, a tail fallback that is THIS BLOCK's alone", async () => {
    // The member spelling the shared resolver deliberately refuses: `key` is a
    // generic entry key, not ObjectStack metadata identity (objectui#3104), so
    // `columnIdentity` returns undefined for it and `colName` adds it after.
    // Both halves asserted, because "the block resolves it" and "the shared
    // resolver does not" is the whole content of "tail fallback".
    expect(columnIdentity({ key: 'status' })).toBeUndefined();
    expect(await resolvesToStatus({ key: 'status' })).toBe(true);
  });

  it('is canonical-FIRST — `field` wins over a disagreeing `name`', async () => {
    // A mixed-key member is the shape that makes the renderer and the data
    // request resolve two different fields. Both directions, because a fold
    // that read only `name` would satisfy a one-sided assertion.
    const mixed = { field: 'status', name: 'subject' };
    expect(await columnsAfterFold([mixed], ['status'])).toEqual([]);
    h.captured = null;
    expect(await columnsAfterFold([mixed], ['subject'])).toEqual([mixed]);
  });

  it('DROPS a member whose identity it cannot resolve — the fold fails CLOSED (objectui#8793)', async () => {
    // `colName` returns null and the filter's else-branch EXCLUDES the entry
    // (`return n ? allowed.has(n) : false`). The member contract's sharp edge,
    // now pointing the safe way: an entry the fold cannot NAME is an entry the
    // fold cannot check, and `RelatedList` renders it anyway as
    // `c?.accessorKey || columnIdentity(c)` — so keeping it was a field-security
    // bypass, not a tolerance. `accessorKey` is the concrete instance: the table
    // LIBRARY's own key, excluded from `columnIdentity` on purpose
    // (objectui#3104). Until objectui#8793 this row pinned the opposite.
    //
    // ⚠️ Two of that bypass's three legs are now caught downstream as well and
    // this row is the only place that still sees THIS one: `filterFLS` refuses a
    // declared field field-security denies, and since objectui#9090
    // `filterRedacted` refuses a redacted one — both resolving the same
    // `accessorKey || columnIdentity` pair. What the fold alone still decides is
    // a key the permission evaluator has no opinion about, pinned over rendered
    // cells as THE RESIDUAL LEG in
    // `RecordRelatedListRenderer.unresolvedIdentityFailClosed-8793.test.tsx`.
    expect(columnIdentity({ accessorKey: 'status' })).toBeUndefined();
    expect(await columnsAfterFold([{ accessorKey: 'status' }], ['status'])).toEqual([]);

    // The drop is by UNRESOLVABILITY, not by matching the redacted name — this
    // is the shape of the change's blast radius and it belongs in the pin, not
    // only in the PR that made it. Redacting a DIFFERENT field drops it just
    // the same, because the fold still cannot say what the column is.
    h.captured = null;
    expect(await columnsAfterFold([{ accessorKey: 'status' }], ['some_other_field'])).toEqual([]);

    // …and the bound on that radius: with nothing to filter, the fold does not
    // run and the same member is handed down untouched.
    h.captured = null;
    expect(await columnsAfterFold([{ accessorKey: 'status' }])).toEqual([
      { accessorKey: 'status' },
    ]);
  });

  it('folds a MIXED-spelling column set member by member, not all-or-nothing', async () => {
    // Non-vacuity for the whole file: every case above uses a single-member
    // array, which a fold that returned its input unchanged would also satisfy
    // for the "kept" half. Here the array must come back SHORTER and in order.
    const set = ['subject', { field: 'status' }, { name: 'owner' }];
    expect(await columnsAfterFold(set, ['status'])).toEqual(['subject', { name: 'owner' }]);
  });

  it('COUNTER-PROBE — with nothing redacted the array is handed down untouched', async () => {
    // The fold only runs when the block filters. Stated so the instrument's
    // limits are on the record: with no `redactFields` and no
    // `enforceFieldSecurity`, no member is read at all and this pin's read site
    // never executes.
    const set = ['subject', { field: 'status' }];
    expect(await columnsAfterFold(set)).toEqual(set);
  });

  it('CONTROL — `redactFields` is an instrument here, not an authoring surface', async () => {
    // See the file docblock. The block's published `inputs` do not declare it,
    // and this assertion is what stops a later reader citing this file as
    // evidence that it is declared.
    expect(input('redactFields')).toBeUndefined();
    expect(input('enforceFieldSecurity')).toBeUndefined();
  });
});
