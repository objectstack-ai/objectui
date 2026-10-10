/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A create form asks the CREATE question of its fields, so a create-only role
 * can fill the form it is allowed to submit (objectui#12082).
 *
 * ## The defect
 *
 * The card's role holds `allowCreate: true, allowEdit: false` on
 * `clm_contract_version`: requesters create versions and never edit them. The
 * form's field gate asked `checkField(object, field, 'write')` in every mode
 * but `view`, and with no field-level entry that question falls back to the
 * object's `allowEdit`. So every field of the CREATE form rendered disabled,
 * and the outbound filter, which asks the same question, stripped every field
 * from the body: the save posted `{}` and the server answered
 * `400 VALIDATION_FAILED` for the required fields. The server accepts the same
 * create (`201`) under the role's real `allowCreate`.
 *
 * ## The server's insert rule, which the create question follows
 *
 * The security middleware's field-level write step refuses an insert that
 * names a field whose explicit field-level entry has `editable: false`; a
 * field with no entry passes it, and object admission (`insert` →
 * `allowCreate`) decides the create. So a create-form field reads: explicit
 * field entry → its `editable`; no entry → the object's create grant. That is
 * the `createFormFields` row of the affordance-to-grant map in
 * `@object-ui/core`, which every form layout reads.
 *
 * ## The rows
 *
 * - the card's repro, on every layout `ObjectForm` routes to: a create-only
 *   grant draws every field enabled, with no notice;
 * - the payload, on the three containers that submit in one step: the body
 *   carries what was typed;
 * - CONTROL, the same grant on an EDIT form: every field stays disabled — the
 *   edit question still reads `allowEdit`;
 * - CONTROL, an explicit field-level `editable: false` stays disabled in the
 *   create form and is absent from the body — the field rule the server has on
 *   insert is kept, and no rule it lacks is added.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';

import { MePermissionsProvider } from '@object-ui/permissions';
import { registerAllFields } from '@object-ui/fields';
import { ObjectForm } from './ObjectForm';

registerAllFields();
afterEach(cleanup);

const OBJECT = 'clm_contract_version';

const FIELDS = {
  contract: { type: 'text', label: 'Contract' },
  version_no: { type: 'number', label: 'Version No.' },
  notes: { type: 'text', label: 'Notes' },
};
const RECORD = { id: 'v1', contract: 'C-1', version_no: 1, notes: 'first' };

/** `/me/permissions` for the card's requester: create, never edit. */
const createOnly = (fields: Record<string, unknown> = {}): any => ({
  authenticated: true,
  userId: 'u-requester',
  tenantId: null,
  roles: ['clm_requester'],
  permissionSets: ['clm_requester'],
  objects: {
    [OBJECT]: { allowCreate: true, allowRead: true, allowEdit: false, allowDelete: false },
  },
  fields,
});

const sections = (names: string[]) => [{ name: 'main', label: 'Main', fields: names }];

const LAYOUTS: Array<{ layout: string; schema: (names: string[]) => Record<string, unknown> }> = [
  { layout: 'simple / sections (default arm)', schema: (n) => ({ sections: sections(n) }) },
  { layout: 'drawer / sections (DrawerForm)', schema: (n) => ({ formType: 'drawer', sections: sections(n) }) },
  { layout: 'modal / sections (ModalForm)', schema: (n) => ({ formType: 'modal', sections: sections(n) }) },
  { layout: 'tabbed / sections (TabbedForm)', schema: (n) => ({ formType: 'tabbed', sections: sections(n) }) },
  { layout: 'split / sections (SplitForm)', schema: (n) => ({ formType: 'split', sections: sections(n) }) },
  { layout: 'wizard / sections (WizardForm)', schema: (n) => ({ formType: 'wizard', sections: sections(n) }) },
  { layout: 'simple / flat (default arm)', schema: (n) => ({ fields: n }) },
  { layout: 'drawer / flat (DrawerForm)', schema: (n) => ({ formType: 'drawer', fields: n }) },
  { layout: 'modal / flat (ModalForm)', schema: (n) => ({ formType: 'modal', fields: n }) },
];

/** The layouts that submit in one step, through the form element. */
const SUBMITTING = LAYOUTS.filter((l) => l.layout.includes('/ flat'));

function makeDS() {
  return {
    getObjectSchema: vi.fn().mockResolvedValue({ name: OBJECT, label: 'Contract Version', fields: FIELDS }),
    findOne: vi.fn().mockResolvedValue({ ...RECORD }),
    find: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn(async (_o: string, d: Record<string, unknown>) => ({ id: 'v2', ...d })),
    update: vi.fn(async (_o: string, _id: string, d: Record<string, unknown>) => ({ ...RECORD, ...d })),
  };
}

function mount(
  layout: (names: string[]) => Record<string, unknown>,
  mode: 'create' | 'edit',
  perms: any,
  ds: ReturnType<typeof makeDS>,
) {
  render(
    <MePermissionsProvider initialPermissions={perms}>
      <ObjectForm
        schema={{
          type: 'object-form',
          objectName: OBJECT,
          ...layout(Object.keys(FIELDS)),
          mode,
          ...(mode === 'edit' ? { recordId: 'v1' } : {}),
          showSubmit: true,
          open: true,
        } as any}
        dataSource={ds as any}
      />
    </MePermissionsProvider>,
  );
}

/** Every drawn field → `true` when it kept NO enabled control (locked). */
function lockedByField(): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const item of document.body.querySelectorAll('[data-field]')) {
    const name = item.getAttribute('data-field') as string;
    out[name] = item.querySelector('input:not([disabled]), textarea:not([disabled])') === null;
  }
  return out;
}

const notices = () => Array.from(document.body.querySelectorAll('[data-testid="closed-affordance-notice"]'));

async function formOnScreen(mode: 'create' | 'edit') {
  await waitFor(() => {
    const el = document.body.querySelector('input[name="contract"]') as HTMLInputElement | null;
    if (!el) throw new Error('form not drawn yet');
    if (mode === 'edit' && el.value !== RECORD.contract) throw new Error('record not on screen yet');
  });
}

function type(name: string, value: string) {
  const el = document.body.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
  if (!el) throw new Error(`${name} not drawn`);
  fireEvent.change(el, { target: { value } });
}

async function submit(ds: ReturnType<typeof makeDS>) {
  const form = document.body.querySelector('form');
  if (!form) throw new Error('no form element');
  fireEvent.submit(form);
  await waitFor(() => expect(ds.create).toHaveBeenCalled());
  const [object, body] = ds.create.mock.calls[0];
  return { object, body: body as Record<string, unknown> };
}

describe.each(LAYOUTS)('ObjectForm $layout under a create-only grant (objectui#12082)', ({ schema }) => {
  it('the create form draws every field enabled, with no closed-affordance notice', async () => {
    mount(schema, 'create', createOnly(), makeDS());
    await formOnScreen('create');
    expect(lockedByField()).toEqual({ contract: false, version_no: false, notes: false });
    expect(notices()).toHaveLength(0);
  });

  it('CONTROL — an edit form under the same grant stays disabled', async () => {
    mount(schema, 'edit', createOnly(), makeDS());
    await formOnScreen('edit');
    expect(lockedByField()).toEqual({ contract: true, version_no: true, notes: true });
  });

  it('CONTROL — an explicit field-level editable: false stays disabled in the create form', async () => {
    mount(
      schema,
      'create',
      createOnly({ [`${OBJECT}.notes`]: { readable: true, editable: false } }),
      makeDS(),
    );
    await formOnScreen('create');
    // Only the field the entry names: whether its siblings are open is the
    // repro row above, so this row stays a control on both sides of the fix.
    expect(lockedByField().notes).toBe(true);
  });
});

describe.each(SUBMITTING)('ObjectForm $layout — the create-only body (objectui#12082)', ({ schema }) => {
  it('the submitted create body carries the typed fields', async () => {
    const ds = makeDS();
    mount(schema, 'create', createOnly(), ds);
    await formOnScreen('create');
    type('contract', 'C-7');
    type('version_no', '3');
    type('notes', 'signed copy');
    const { object, body } = await submit(ds);
    expect(object).toBe(OBJECT);
    expect(body).toMatchObject({ contract: 'C-7', version_no: 3, notes: 'signed copy' });
  });

  // The lit half (`contract`, `version_no` on the wire) keeps "absent" meaning
  // "the field rule fired" rather than "the form sent nothing", so this row is
  // red wherever the repro row is.
  it('CONTROL — an explicit field-level editable: false never reaches the create body', async () => {
    const ds = makeDS();
    mount(schema, 'create', createOnly({ [`${OBJECT}.notes`]: { readable: true, editable: false } }), ds);
    await formOnScreen('create');
    type('contract', 'C-7');
    type('version_no', '3');
    const { body } = await submit(ds);
    expect(body).toMatchObject({ contract: 'C-7', version_no: 3 });
    expect(body).not.toHaveProperty('notes');
  });
});
