// Copyright (c) 2026 ObjectStack. Licensed under the MIT license.
//
// objectui#2382 — the 已分配用户 section must count EFFECTIVE holders:
// direct grants ∪ holders of every position bound to the set. A
// direct-grants-only list told the admin "0 users" for any
// normally-administered set (positions are THE distribution channel in
// ADR-0090), right before they edit or delete it.
//
// objectui#7611 — by NAME, against the registry: grants are read by their
// `permission_set` name column, and the positions that distribute the set are
// the registry's position definitions whose `permissionSets` names it
// (ADR-0131 D4) — never `sys_position_permission_set` / `sys_position` rows.

import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AssignedUsersSection } from './AssignedUsersSection';

vi.mock('@object-ui/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAdapter: () => mockAdapter,
  useMetadata: () => mockMetadataStore,
}));
vi.mock('@object-ui/fields', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@object-ui/fields')>()),
  RecordPickerDialog: () => null,
}));

// The registry's position definitions — the binding is part of the definition.
const registryPositions = [
  { name: 'contributor', label: 'Contributor', permissionSets: ['showcase_contributor'] },
  { name: 'everyone', label: 'Everyone', permissionSets: ['member_default', 'showcase_contributor'] },
  { name: 'auditor', label: 'Auditor', permissionSets: ['showcase_auditor'] },
];
const mockMetadataStore = { ensureType: vi.fn(async () => registryPositions) };

const data: Record<string, any[]> = {
  sys_permission_set: [{ id: 'ps_1', name: 'showcase_contributor' }],
  sys_user_permission_set: [
    { id: 'grant_1', permission_set_id: 'ps_1', permission_set: 'showcase_contributor', user_id: 'u_direct' },
  ],
  sys_user_position: [
    { id: 'up_1', user_id: 'u_held', position: 'contributor' },
    // The direct grantee ALSO holds the position — must merge into one row.
    { id: 'up_2', user_id: 'u_direct', position: 'contributor' },
  ],
  sys_user: [
    { id: 'u_direct', name: 'Direct Dana', email: 'dana@example.com' },
    { id: 'u_held', name: 'Held Henry', email: 'henry@example.com' },
  ],
};

const mockAdapter = {
  find: vi.fn(async (object: string, query: any) => {
    const rows = data[object] ?? [];
    const filter = query?.$filter ?? {};
    return rows.filter((r) =>
      Object.entries(filter).every(([k, v]: [string, any]) => {
        if (v && typeof v === 'object' && Array.isArray(v.$in)) return v.$in.includes(r[k]);
        return r[k] === v;
      }),
    );
  }),
  create: vi.fn(),
  delete: vi.fn(),
};

describe('AssignedUsersSection — effective holders (objectui#2382)', () => {
  it('lists direct grantees AND position-held users, with via badges', async () => {
    render(<AssignedUsersSection permissionSetName="showcase_contributor" />);

    await waitFor(() => expect(screen.getByText('Direct Dana')).toBeTruthy());
    // Position-held user appears even with no direct grant.
    expect(screen.getByText('Held Henry')).toBeTruthy();
    // Count = deduped users (u_direct merged), not junction rows.
    expect(screen.getByText('2')).toBeTruthy();
    // Attribution badges.
    expect(screen.getAllByText('direct').length).toBeGreaterThan(0);
    expect(screen.getAllByText('via position contributor').length).toBeGreaterThan(0);
  });

  it('surfaces the everyone-anchor binding as a note instead of enumerating members', async () => {
    render(<AssignedUsersSection permissionSetName="showcase_contributor" />);
    await waitFor(() =>
      expect(screen.getByText(/every signed-in member holds this set/i)).toBeTruthy(),
    );
  });

  it('keeps the remove affordance only on direct grants', async () => {
    render(<AssignedUsersSection permissionSetName="showcase_contributor" />);
    await waitFor(() => expect(screen.getByText('Held Henry')).toBeTruthy());
    // One removable (direct grant) row → exactly one Remove button.
    expect(screen.getAllByLabelText('Remove')).toHaveLength(1);
  });
});

describe('AssignedUsersSection — by name, against the registry (objectui#7611)', () => {
  it('reads grants by the set NAME and the distributing positions from the registry', async () => {
    mockAdapter.find.mockClear();
    render(<AssignedUsersSection permissionSetName="showcase_contributor" />);
    await waitFor(() => expect(screen.getByText('Held Henry')).toBeTruthy());

    const reads = mockAdapter.find.mock.calls.map(([object]) => object);
    // No catalog row is read to LIST holders.
    expect(reads).not.toContain('sys_position_permission_set');
    expect(reads).not.toContain('sys_position');
    expect(reads).not.toContain('sys_permission_set');
    const grantQuery = mockAdapter.find.mock.calls.find(([o]) => o === 'sys_user_permission_set')?.[1];
    expect(grantQuery?.$filter).toEqual({ permission_set: 'showcase_contributor' });
    expect(mockMetadataStore.ensureType).toHaveBeenCalledWith('position');
  });

  it('a position whose definition does not name the set contributes nobody', async () => {
    render(<AssignedUsersSection permissionSetName="showcase_auditor" />);
    // `auditor` names `showcase_auditor`, but nobody holds it in the fixture,
    // and the direct grant above is for another set: an empty list.
    await waitFor(() => expect(screen.getByText(/No users assigned yet/)).toBeTruthy());
  });
});
