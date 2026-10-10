// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#7611 — the permission-set editor as the Setup catalog's set page
 * (the environment scope, `catalog-scope.ts`):
 *
 *  - in the environment scope, routed, the set's holders render under its
 *    definition; Studio (no scope) and an embedded host do not show them —
 *    assigning stays a Setup act (ADR-0056 P4);
 *  - a caller without `manage_metadata` gets no Save and a stated reason (the
 *    #22621 → A parity gate: an organization administrator reads the catalog
 *    and the page says why). The control is the same set for a holder.
 */
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const SET = { name: 'env_set', label: 'Environment Set', objects: {}, fields: {} };

const CLIENT = {
  layered: async () => ({ effective: SET, code: null, overlay: null, overlayScope: null }),
  getDraft: async () => null,
  list: async (type: string) => (type === 'object' ? [{ item: { name: 'a_account' } }] : []),
  get: async (type: string) => (type === 'object' ? { fields: [] } : null),
  save: async (_t: string, _n: string, payload: Record<string, unknown>) => payload,
} as any;

vi.mock('./useMetadata', () => ({
  useMetadataClient: () => CLIENT,
  useMetadataTypes: () => ({
    loading: false,
    error: null,
    entries: [{ type: 'permission', label: 'Permission', allowOrgOverride: false, allowRuntimeCreate: true }],
  }),
}));
vi.mock('./AssignedUsersSection', () => ({
  AssignedUsersSection: ({ permissionSetName }: { permissionSetName: string }) => (
    <div data-testid="assigned-users-stub">{permissionSetName}</div>
  ),
}));

let canAuthor = true;
vi.mock('../../hooks/useCanAuthorMetadata', () => ({
  useCanAuthorMetadata: () => canAuthor,
}));

import { PermissionMatrixEditPage } from './PermissionMatrixEditor';
import { t } from './i18n';

beforeEach(() => {
  canAuthor = true;
});
afterEach(cleanup);

async function mount(search: string, props: { embedded?: boolean } = {}) {
  render(
    <MemoryRouter initialEntries={[`/apps/setup/metadata/permission/env_set${search}`]}>
      <PermissionMatrixEditPage type="permission" name="env_set" {...props} />
    </MemoryRouter>,
  );
  await screen.findByText('Environment Set');
}

describe('the set page in the Setup catalog (objectui#7611)', () => {
  it('shows the set’s holders in the environment scope', async () => {
    await mount('?scope=environment');
    expect(screen.getByTestId('assigned-users-stub')).toHaveTextContent('env_set');
  });

  it('Studio (no scope) does not', async () => {
    await mount('');
    expect(screen.queryByTestId('assigned-users-stub')).toBeNull();
  });

  it('an embedded host does not, even in the scope', async () => {
    await mount('?scope=environment', { embedded: true });
    expect(screen.queryByTestId('assigned-users-stub')).toBeNull();
  });
});

describe('the caller gate (#22621 → A)', () => {
  const save = () => screen.queryByRole('button', { name: t('engine.edit.save', 'en-US') });

  it('a holder of manage_metadata gets Save and no reason', async () => {
    await mount('?scope=environment');
    expect(save()).not.toBeNull();
    expect(screen.queryByTestId('perm-capability-readonly')).toBeNull();
  });

  it('a caller without it gets no Save and the stated reason', async () => {
    canAuthor = false;
    await mount('?scope=environment');
    expect(save()).toBeNull();
    expect(screen.getByTestId('perm-capability-readonly')).toHaveTextContent(/manage_metadata/);
  });
});
