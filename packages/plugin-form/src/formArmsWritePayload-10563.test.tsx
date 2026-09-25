/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Every layout `ObjectForm` routes a record save through writes the SAME
 * payload (objectui#10563).
 *
 * ## The defect
 *
 * The simple form, `ModalForm` and `DrawerForm` build what a save writes in one
 * sequence: strip what the form never writes (`sanitizeFormData` — server-owned,
 * computed, read-only, unknown to the object, and refused by field-level
 * security through `fieldWriteGate`), then, on an edit, keep only the fields
 * that differ from the record the form read (`dirtyEditPayload`,
 * objectui#10156). `TabbedForm`, `SplitForm` and `WizardForm` did neither. An
 * edit on any of them wrote every value the form held — `id`, `owner_id`,
 * `created_by`, `updated_at`, the formula column and the field the caller may
 * read but not edit — which the server answers with a 403 (objectui#10108) or
 * an unknown-field refusal. A simple form whose mobile `stepper` option shows it
 * one field at a time is rendered by `WizardForm`, so it took the same route.
 *
 * ## The rows, and what makes each one able to fail
 *
 * One row per route and per write, with the simple form as the lit control on
 * the same record, the same principal and the same edit:
 *
 * - "edit" asserts the EXACT payload after changing one field. A route that
 *   writes its raw values sends the whole record, so it goes red.
 * - "nothing changed" asserts the exact payload of a save with no edit. The
 *   dirty diff sends the full sanitized payload then, so this is the row where
 *   only the strip stands between the server and the refused columns; it goes
 *   red on a route that diffs but does not sanitize. The two business columns
 *   that ARE on the wire are its control: the fix is "send the right fields",
 *   not "send fewer".
 * - "host seam" asserts what a host `submitHandler` receives on an edit — the
 *   same payload the form would have written itself.
 * - "create" asserts that a create seeded with a whole record (a copy of an
 *   existing one) posts its business columns and none of the refused ones. The
 *   simple form has always stripped a create; the three layouts did not.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor, fireEvent, act, cleanup } from '@testing-library/react';
import React from 'react';

import { MePermissionsProvider } from '@object-ui/permissions';
import { registerAllFields } from '@object-ui/fields';
import { ObjectForm } from './ObjectForm';

registerAllFields();
afterEach(cleanup);

const VERSION = '2026-09-25 00:00:00.000';

/**
 * The card's object. `total` is a formula column, `owner_id` / `created_by` /
 * `updated_at` are the columns the platform stamps, and `score` is an ordinary
 * business column that only the CALLER's permission set refuses.
 */
const DEAL_SCHEMA = {
  name: 'deal',
  fields: {
    name: { type: 'text', label: 'Name' },
    stage: { type: 'text', label: 'Stage' },
    total: { type: 'formula', label: 'Total', formula: 'qty * price' },
    score: { type: 'number', label: 'Score' },
    owner_id: { type: 'lookup', label: 'Owner', system: true },
    created_by: { type: 'lookup', label: 'Created by', system: true },
    updated_at: { type: 'datetime', label: 'Updated', system: true },
  },
};

/** The record exactly as `dataSource.findOne` returns it. */
const STORED = {
  id: 'd1',
  name: 'Mine',
  stage: 'open',
  total: 42,
  score: 7,
  owner_id: 'u9',
  created_by: 'u9',
  updated_at: VERSION,
};

/** Everything on {@link STORED} a form may never write for this caller. */
const REFUSED = ['id', 'total', 'score', 'owner_id', 'created_by', 'updated_at'] as const;

/** The caller may read `score` but not edit it. */
const PRINCIPAL: any = {
  authenticated: true,
  userId: 'u-editor',
  tenantId: null,
  roles: ['deal_editor'],
  permissionSets: ['deal_editor'],
  objects: { deal: { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: false } },
  fields: { 'deal.score': { readable: true, editable: false } },
};

const MEMBERS = ['name', 'stage', 'total', 'score'];
const SECTIONS = [
  { name: 'main', label: 'Main', fields: ['name', 'stage'] },
  { name: 'more', label: 'More', fields: ['total', 'score'] },
];

/**
 * The routes a record save can take out of `ObjectForm`. `steps` is how many
 * times the step form is submitted before the last one writes: the wizard
 * collects a step per submit, and the stepper here is one step of every field.
 */
const ROUTES: Array<{ route: string; layout: Record<string, unknown>; steps: number }> = [
  { route: 'simple (control)', layout: { fields: MEMBERS }, steps: 1 },
  { route: 'tabbed (TabbedForm)', layout: { formType: 'tabbed', sections: SECTIONS }, steps: 1 },
  { route: 'split (SplitForm)', layout: { formType: 'split', sections: SECTIONS }, steps: 1 },
  { route: 'wizard (WizardForm)', layout: { formType: 'wizard', sections: SECTIONS }, steps: 2 },
  {
    route: 'simple + mobile.stepper (WizardForm)',
    layout: { fields: MEMBERS, mobile: { stepper: true, stepperFieldsPerStep: 99 } },
    steps: 1,
  },
];

function makeDS() {
  return {
    getObjectSchema: vi.fn().mockResolvedValue(DEAL_SCHEMA),
    findOne: vi.fn().mockResolvedValue({ ...STORED }),
    find: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn(async (_o: string, d: any) => ({ id: 'new1', ...d })),
    update: vi.fn(async (_o: string, _id: string, d: any) => ({ ...STORED, ...d })),
  };
}

function mount(schema: Record<string, unknown>, ds: ReturnType<typeof makeDS>) {
  return render(
    <MePermissionsProvider initialPermissions={PRINCIPAL}>
      <ObjectForm schema={{ type: 'object-form', objectName: 'deal', ...schema } as any} dataSource={ds as any} />
    </MePermissionsProvider>,
  ).container;
}

/** The `name` input, once it shows `value` — i.e. once the record is on screen. */
const nameInput = (root: HTMLElement, value: string) =>
  waitFor(() => {
    const el = root.querySelector('input[name="name"]') as HTMLInputElement | null;
    if (!el) throw new Error('name not rendered');
    if (el.value !== value) throw new Error('record not on screen yet');
    return el;
  });

async function submitSteps(root: HTMLElement, steps: number) {
  for (let i = 0; i < steps; i++) {
    await act(async () => {
      fireEvent.submit(root.querySelector('form') as HTMLFormElement);
    });
  }
}

describe.each(ROUTES)('ObjectForm $route', ({ layout, steps }) => {
  const editSchema = { ...layout, mode: 'edit', recordId: 'd1' };

  it('edit: changing one field writes that field alone, with the OCC token it read', async () => {
    const ds = makeDS();
    const root = mount(editSchema, ds);

    const input = await nameInput(root, 'Mine');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Mine v2' } });
    });
    await submitSteps(root, steps);

    await waitFor(() => expect(ds.update).toHaveBeenCalledTimes(1));
    expect(ds.update).toHaveBeenCalledWith('deal', 'd1', { name: 'Mine v2' }, { ifMatch: VERSION });
  });

  it('nothing changed: the full payload carries the business columns and none of the refused ones', async () => {
    const ds = makeDS();
    const root = mount(editSchema, ds);

    await nameInput(root, 'Mine');
    await submitSteps(root, steps);

    await waitFor(() => expect(ds.update).toHaveBeenCalledTimes(1));
    const payload = ds.update.mock.calls[0][2];
    for (const key of REFUSED) expect(payload).not.toHaveProperty(key);
    expect(payload).toEqual({ name: 'Mine', stage: 'open' });
  });

  it('host seam: an edit hands the submitHandler what the form would have written', async () => {
    const ds = makeDS();
    const submitHandler = vi.fn(async (values: any) => ({ ...STORED, ...values }));
    const root = mount({ ...editSchema, submitHandler }, ds);

    const input = await nameInput(root, 'Mine');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Mine v2' } });
    });
    await submitSteps(root, steps);

    await waitFor(() => expect(submitHandler).toHaveBeenCalledTimes(1));
    expect(submitHandler).toHaveBeenCalledWith({ name: 'Mine v2' });
    expect(ds.update).not.toHaveBeenCalled();
  });

  it('create: a create seeded with a whole record posts its business columns and none of the refused ones', async () => {
    const ds = makeDS();
    const root = mount({ ...layout, mode: 'create', initialValues: { ...STORED } }, ds);

    const input = await nameInput(root, 'Mine');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Copy of Mine' } });
    });
    await submitSteps(root, steps);

    await waitFor(() => expect(ds.create).toHaveBeenCalledTimes(1));
    const payload = ds.create.mock.calls[0][1];
    for (const key of REFUSED) expect(payload).not.toHaveProperty(key);
    expect(payload).toEqual({ name: 'Copy of Mine', stage: 'open' });
  });
});
