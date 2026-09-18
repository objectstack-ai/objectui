/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `object-form.initialValues` and `object-form.initialData` — the MEMBER shape
 * this renderer reads (objectui#8071, criterion from objectui#8068).
 *
 * Both are registered `{ type: 'object' }` with prose only — "Values to prefill
 * in `create` mode" and "Alternate spelling of `initialValues` that the
 * drawer/modal presentations read FIRST". `ObjectFormSchema` types them
 * `Record<string, any>`, so EVERY object parses on both sides and nothing
 * declared says what a member is or what happens when both keys are authored.
 * That is the population objectui#8068 refuses to leave unwatched.
 *
 * WHAT THE RENDERER READS, measured at `ObjectForm.tsx` — the two sites that
 * seed `initialData` state, the inline-fields effect and the create branch of
 * `fetchInitialData`, both spelled:
 *
 *     setInitialData(schema.initialData || schema.initialValues || {});
 *
 *   1. a MEMBER is a FIELD NAME, and its value is that control's opening value;
 *   2. the two keys are chosen between as WHOLE OBJECTS — `||`, never a merge.
 *
 * ⛔ Row 3 is the one that makes this a pin rather than a restatement, and it is
 * the row a plausible "improvement" breaks. Nothing declared distinguishes
 * `schema.initialData || schema.initialValues` from
 * `{ ...schema.initialValues, ...schema.initialData }`; the second reads like
 * the friendlier spelling of "alternate spelling … read FIRST" and is what a
 * per-member precedence would mean. It is NOT what the renderer does: with both
 * authored, every member of `initialValues` is dropped, including the ones
 * `initialData` says nothing about. An author who prefills three fields through
 * `initialValues` and adds a one-member `initialData` loses the other two, with
 * no warning and no empty state — the form simply opens blank where it used to
 * open seeded.
 *
 * Row 4 is the same read at its sharp edge: `||` tests the OBJECT's
 * truthiness, and `{}` is truthy, so an EMPTY `initialData` shadows a populated
 * `initialValues` completely. Pinned as the renderer's behaviour, ⛔ not
 * endorsed as the right one — see the report on objectui#8071 for the finding
 * handed back rather than fixed here, because changing it is a renderer change
 * and this card writes pins only.
 *
 * Row 5 is the non-vacuity control: with neither key authored the same controls
 * render EMPTY, so rows 1-4 cannot be passing on a form that ignores both keys.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { registerAllFields } from '@object-ui/fields';
import { ObjectForm } from '../ObjectForm';

registerAllFields();

const OBJECT_SCHEMA = {
  name: 'invoice',
  fields: {
    customer: { type: 'text', label: 'Customer' },
    note: { type: 'text', label: 'Note' },
  },
};

const makeDataSource = () =>
  ({
    getObjectSchema: vi.fn().mockResolvedValue(OBJECT_SCHEMA),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }) as any;

/** Render a create-mode `object-form` and read back both controls' values. */
async function openingValues(
  schema: Record<string, unknown>,
): Promise<{ customer: string | null; note: string | null }> {
  const { container } = render(
    <ObjectForm
      schema={{ type: 'object-form', objectName: 'invoice', mode: 'create', ...schema } as any}
      dataSource={makeDataSource()}
    />,
  );
  await waitFor(() => {
    if (!container.querySelector('input[name="customer"]')) throw new Error('form not ready');
  });
  const read = (name: string) =>
    (container.querySelector(`input[name="${name}"]`) as HTMLInputElement | null)?.value ?? null;
  return { customer: read('customer'), note: read('note') };
}

describe('`object-form` — the member shape of `initialValues` / `initialData`', () => {
  it('1. an `initialValues` member is a FIELD NAME, and its value opens that control', async () => {
    expect(await openingValues({ initialValues: { customer: 'Alpha', note: 'from initialValues' } })).toEqual({
      customer: 'Alpha',
      note: 'from initialValues',
    });
  });

  it('2. `initialData` carries the same member vocabulary, and a field it omits opens empty', async () => {
    expect(await openingValues({ initialData: { customer: 'Beta' } })).toEqual({
      customer: 'Beta',
      note: '',
    });
  });

  it('3. with BOTH authored the choice is whole-object — every `initialValues` member is dropped, ⛔ not merged', async () => {
    expect(
      await openingValues({
        initialData: { customer: 'Beta' },
        initialValues: { customer: 'Alpha', note: 'from initialValues' },
      }),
      'a per-member merge would leave `note` seeded; the renderer picks one object and discards the other',
    ).toEqual({ customer: 'Beta', note: '' });
  });

  it('4. an EMPTY `initialData` still shadows a populated `initialValues` — `||` tests the object, not its size', async () => {
    expect(
      await openingValues({ initialData: {}, initialValues: { customer: 'Alpha', note: 'from initialValues' } }),
    ).toEqual({ customer: '', note: '' });
  });

  it('5. control: with neither key authored the same controls open EMPTY', async () => {
    expect(await openingValues({})).toEqual({ customer: '', note: '' });
  });
});
