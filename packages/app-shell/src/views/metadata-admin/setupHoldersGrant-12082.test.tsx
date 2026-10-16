// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Setup's holders sections read the affordance-to-grant map (objectui#12082,
 * the census's last four `unmapped` write sites).
 *
 * A permission set's holders (`AssignedUsersSection`) and a position's holders
 * (`PositionHoldersSection`) each offered Add and a per-row Remove to whoever
 * reached the page, and read no grant. Reaching the page is not the grant: the
 * Setup app asks `setup.access`, and objectstack's shipped organization
 * administrator set holds it while it is read-only on both assignment objects,
 * so that caller was offered writes the server refuses at its object CRUD
 * step. Now each write reads its row, asked of the object it writes:
 *
 *  - Add (a junction row created): `relatedNew`, the create grant;
 *  - Remove (a junction row deleted): `relatedRowDelete`, the delete grant.
 *
 * Real subjects: both sections under the REAL `MePermissionsProvider` holding
 * the caller's `/me/permissions` answer. The adapter and the metadata store
 * are fixtures; the picker stands in as a marker so its mount can be read.
 */

import * as React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MePermissionsProvider, type MePermissionsResponse } from '@object-ui/permissions';

vi.mock('@object-ui/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAdapter: () => adapter,
  useMetadata: () => metadataStore,
}));
// The picker stands in as a marker, rendered whenever it is mounted (open or not).
vi.mock('@object-ui/fields', async (importOriginal) => {
  const { createElement } = await import('react');
  return {
    ...(await importOriginal<typeof import('@object-ui/fields')>()),
    RecordPickerDialog: () => createElement('div', { 'data-testid': 'record-picker' }),
  };
});

import { AssignedUsersSection } from './AssignedUsersSection';
import { PositionHoldersSection } from './PositionHoldersSection';

const GRANT_OBJECT = 'sys_user_permission_set';
const HOLDING_OBJECT = 'sys_user_position';

const data: Record<string, Array<Record<string, string>>> = {
  [GRANT_OBJECT]: [{ id: 'grant_1', permission_set: 'showcase_contributor', user_id: 'u_direct' }],
  [HOLDING_OBJECT]: [{ id: 'up_1', user_id: 'u_held', position: 'auditor' }],
  sys_user: [
    { id: 'u_direct', name: 'Direct Dana', email: 'dana@example.com' },
    { id: 'u_held', name: 'Held Henry', email: 'henry@example.com' },
  ],
};

const adapter = {
  find: vi.fn(async (object: string, query: { $filter?: Record<string, unknown> } | undefined) => {
    const filter = query?.$filter ?? {};
    return {
      data: (data[object] ?? []).filter((row) =>
        Object.entries(filter).every(([k, v]) =>
          v && typeof v === 'object' && Array.isArray((v as { $in?: unknown[] }).$in)
            ? (v as { $in: unknown[] }).$in.includes(row[k])
            : row[k] === v,
        ),
      ),
    };
  }),
  create: vi.fn(async () => ({})),
  delete: vi.fn(async () => ({})),
};

/** The registry: both assignment objects as objectstack registers them (`system-data`, full CRUD by default). */
const metadataStore = {
  objects: [
    { name: GRANT_OBJECT, label: 'User Permission Set', managedBy: 'system-data' },
    { name: HOLDING_OBJECT, label: 'User Position', managedBy: 'system-data' },
  ],
  ensureType: vi.fn(async () => []),
};

/** The grant shapes on one assignment object, as `/me/permissions` carries them. */
const SHAPE = {
  readOnly: { allowRead: true, allowCreate: false, allowEdit: false, allowDelete: false },
  createOnly: { allowRead: true, allowCreate: true, allowEdit: false, allowDelete: false },
  deleteOnly: { allowRead: true, allowCreate: false, allowEdit: false, allowDelete: true },
  full: { allowRead: true, allowCreate: true, allowEdit: true, allowDelete: true },
} as const;

function answer(objects: MePermissionsResponse['objects']): MePermissionsResponse {
  return {
    authenticated: true,
    userId: 'u-admin',
    tenantId: null,
    roles: ['member'],
    permissionSets: ['member'],
    objects,
    fields: {},
  } as MePermissionsResponse;
}

/**
 * An organization administrator's answer: a super-user wildcard beside the
 * explicit read-only entries its set names for both assignment objects. The
 * explicit entry is the set's whole answer for the object, on the server's
 * evaluator and in the map it hands the client alike.
 */
const ORG_ADMIN = answer({
  '*': {
    allowRead: true,
    allowCreate: true,
    allowEdit: true,
    allowDelete: true,
    viewAllRecords: true,
    modifyAllRecords: true,
  },
  [GRANT_OBJECT]: SHAPE.readOnly,
  [HOLDING_OBJECT]: SHAPE.readOnly,
} as MePermissionsResponse['objects']);

const SECTIONS = [
  {
    name: 'AssignedUsersSection',
    object: GRANT_OBJECT,
    holder: 'Direct Dana',
    add: 'Add user',
    element: <AssignedUsersSection permissionSetName="showcase_contributor" />,
  },
  {
    name: 'PositionHoldersSection',
    object: HOLDING_OBJECT,
    holder: 'Held Henry',
    add: 'Add holder',
    element: <PositionHoldersSection name="auditor" />,
  },
] as const;

type Section = (typeof SECTIONS)[number];

/** Mounts a section and waits for its holder to list. `perms` null is the no-provider host. */
async function mount(section: Section, perms: MePermissionsResponse | null) {
  render(perms ? <MePermissionsProvider initialPermissions={perms}>{section.element}</MePermissionsProvider> : section.element);
  await waitFor(() => expect(screen.getByText(section.holder)).toBeInTheDocument());
}

/** What the section offers: its Add button, the picker that Add feeds, and its rows' Remove. */
const offered = (section: Section) => ({
  add: !!screen.queryByRole('button', { name: section.add }),
  picker: !!screen.queryByTestId('record-picker'),
  remove: screen.queryAllByRole('button', { name: 'Remove' }).length > 0,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe.each(SECTIONS)("Setup's $name reads relatedNew / relatedRowDelete on its assignment object (objectui#12082)", (section) => {
  it('an organization administrator — read-only on the assignment object beside a super-user wildcard — sees the holders and is offered no write', async () => {
    await mount(section, ORG_ADMIN);
    expect(offered(section)).toEqual({ add: false, picker: false, remove: false });
  });

  it.each([
    ['read-only', SHAPE.readOnly, { add: false, picker: false, remove: false }],
    ['create-only', SHAPE.createOnly, { add: true, picker: true, remove: false }],
    ['delete-only', SHAPE.deleteOnly, { add: false, picker: false, remove: true }],
    ['full', SHAPE.full, { add: true, picker: true, remove: true }],
  ] as const)('under a %s grant on the assignment object, Add follows create and Remove follows delete', async (_shape, bits, expected) => {
    await mount(section, answer({ [section.object]: bits }));
    expect(offered(section)).toEqual(expected);
  });

  it('an effective operation set without create or delete closes both, whatever the grant', async () => {
    await mount(section, answer({ [section.object]: { ...SHAPE.full, apiOperations: ['get', 'list'] } }));
    expect(offered(section)).toEqual({ add: false, picker: false, remove: false });
  });

  it('CONTROL — with no permission provider both are offered, as before', async () => {
    await mount(section, null);
    expect(offered(section)).toEqual({ add: true, picker: true, remove: true });
  });
});
