/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `object-master-detail-form.sections` — the MEMBER shape THIS block reads
 * (objectui#8071, criterion from objectui#8068).
 *
 * The key is registered `{ type: 'array' }` with no `of` and typed `any[]` on
 * `MasterDetailFormSchema`, so every array parses on both declared sides and
 * nothing declared says what a member is. The only prose is the type's own
 * comment, "Parent form sections/fields — passed straight through to
 * ObjectForm", which names the carrier and says nothing about the contract.
 *
 * ## Why it is pinned here and not delegated to the sibling block's pin
 *
 * `MasterDetailForm` builds a `parentSchema` object in its `parentSchema` memo,
 * copies `sections` onto it KEY BY KEY, and renders it through a DIRECTLY
 * imported `<ObjectForm>` — no `SchemaRenderer`, no registry lookup. So the
 * member resolution IS `object-form`'s (pinned next door in
 * `objectFormSectionMembers-8071.test.tsx`), reached through a hand-written
 * copy that can drop a key without any declaration changing — the exact failure
 * that file records twice over for `description` (objectui#9779,
 * objectui#9834).
 *
 * ⛔ What this file therefore does NOT re-assert, because those rows are owned
 * next door and duplicating them would buy nothing: `collapsed` vs
 * `collapsible`, the `name`-alone heading, the untitled trailing bucket, and
 * the `description` blurb. The presentation routing (`simple` / `tabbed`, and
 * the four values this block's `formType` deliberately does not declare) is
 * owned by `masterDetailFormTypeVocabulary.test.tsx`.
 *
 * ## The rows
 *
 *   1. a member is a section OBJECT; its `fields` are read as a SET, so the
 *      parent OBJECT's field order wins over the authored member order — and
 *      the block's own `details` are untouched by any of it, which is the half
 *      only this block can state.
 *   2. a member that resolves to NO parent field is dropped WHOLE, heading
 *      included — silently. Measured with a DETAIL column name as the member,
 *      the mistake this composition invites: two field vocabularies on one
 *      node, and only one of them is `sections`'.
 *   3. ⭐ the sharp row, and a DIVERGENCE from the block's own registration:
 *      `fields` is declared "Ignored when `sections` is given — sections carry
 *      their own field lists", and it is not ignored. `ObjectForm` builds the
 *      parent field pool from `schema.fields` FIRST and a section resolves its
 *      members against that pool, so authoring both INTERSECTS them: a section
 *      member absent from `fields` is dropped with no diagnostic, and a section
 *      whose every member is absent disappears heading and all. Pinned as the
 *      renderer's behaviour and handed back as a finding on objectui#8071 —
 *      ⛔ not fixed here, because fixing it changes either the renderer or the
 *      declaration, and this card writes pins only.
 *   4. the non-vacuity control: with no `sections` the same parent fields
 *      render flat and no divider is drawn, so every absence above is about a
 *      form that drew something.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { registerAllFields } from '@object-ui/fields';
import { MasterDetailForm } from '../MasterDetailForm';

registerAllFields();

/** Parent object — three text fields, declared in this order. */
const PARENT_OBJECT = {
  name: 'po',
  fields: {
    ref: { type: 'text', label: 'Ref' },
    memo: { type: 'text', label: 'Memo' },
    amount: { type: 'text', label: 'Amount' },
  },
};

const makeDataSource = () =>
  ({
    getObjectSchema: vi.fn().mockResolvedValue(PARENT_OBJECT),
    find: vi.fn().mockResolvedValue({ data: [] }),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    bulk: vi.fn(),
    batchTransaction: vi.fn().mockResolvedValue({ results: [{ id: 'po1' }] }),
  }) as any;

/** One child collection with an explicit column, so the detail half is observable. */
const DETAILS = [
  {
    childObject: 'po_line',
    relationshipField: 'po',
    columns: [{ key: 'qty', label: 'Qty', type: 'number' }],
  },
];

async function mount(schema: Record<string, unknown>): Promise<HTMLElement> {
  const { container } = render(
    <MasterDetailForm
      schema={{ objectName: 'po', mode: 'create', details: DETAILS, ...schema } as any}
      dataSource={makeDataSource()}
    />,
  );
  await waitFor(() => {
    if (!container.querySelector('form')) throw new Error('parent form not ready');
  });
  return container as HTMLElement;
}

/** The parent field controls actually drawn, in DOM order. */
const drawnFields = (c: HTMLElement): string[] =>
  [...c.querySelectorAll('[data-field]')].map((el) => el.getAttribute('data-field') as string);

/** The section headings actually drawn, in DOM order. */
const headings = (c: HTMLElement): string[] =>
  [...c.querySelectorAll('.border-b span')].map((el) => el.textContent ?? '');

/** The detail collection is still on screen — the half `sections` must not move. */
const detailIsDrawn = (c: HTMLElement): boolean => (c.textContent ?? '').includes('Qty');

describe('`object-master-detail-form` — the member shape of `sections`', () => {
  it('1. a member’s `fields` are parent field NAMES read as a SET — the OBJECT’s order wins — and the `details` half is untouched', async () => {
    const c = await mount({
      sections: [{ name: 'head', label: 'Header', fields: ['memo', 'ref'] }],
    });
    expect(headings(c)).toEqual(['Header']);
    expect(
      drawnFields(c),
      'the section resolves its members by filtering the parent object’s own field list, so the ' +
        'authored member order (`memo` before `ref`) is discarded',
    ).toEqual(['ref', 'memo']);
    expect(
      detailIsDrawn(c),
      '`sections` shapes the PARENT half only — the child collections keep their own columns',
    ).toBe(true);
  });

  it('2. a member that resolves to NO parent field is dropped whole — heading and all', async () => {
    // `qty` is a DETAIL column, not a parent field: the vocabulary mistake this
    // composition invites, since one node declares both halves.
    const c = await mount({
      sections: [
        { label: 'Lines', fields: ['qty'] },
        { label: 'Header', fields: ['ref'] },
      ],
    });
    expect(headings(c), 'a section that resolves no parent field never reaches a divider').toEqual([
      'Header',
    ]);
    expect(drawnFields(c)).toEqual(['ref']);
    expect(detailIsDrawn(c), 'and the detail column it named is still drawn by `details`, not by it').toBe(
      true,
    );
  });

  it('3. `fields` is NOT ignored when `sections` is given — the two INTERSECT, and the loser is silent', async () => {
    const c = await mount({
      fields: ['ref'],
      sections: [
        { label: 'Header', fields: ['ref', 'memo'] },
        { label: 'Notes', fields: ['memo'] },
      ],
    });
    expect(
      drawnFields(c),
      'the registration declares `fields` "Ignored when `sections` is given"; the renderer builds ' +
        'the parent pool from `fields` first and the section filters against THAT, so `memo` — a ' +
        'member the section names and the object declares — is dropped with no diagnostic',
    ).toEqual(['ref']);
    expect(
      headings(c),
      'a section whose every member lost that intersection disappears heading and all',
    ).toEqual(['Header']);
  });

  it('4. control: with NO `sections` the same parent fields render flat and no divider is drawn', async () => {
    const c = await mount({});
    expect(headings(c)).toEqual([]);
    expect(drawnFields(c)).toEqual(['ref', 'memo', 'amount']);
    expect(detailIsDrawn(c)).toBe(true);
  });
});
