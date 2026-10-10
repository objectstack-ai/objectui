// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#7611 — the metadata list in its ENVIRONMENT scope is the Setup
 * catalog (objectstack ADR-0131 D3/D7; `catalog-scope.ts`).
 *
 * What is pinned, each against a control that discriminates it:
 *
 *  - the environment scope lists EVERY registry item of the type — the
 *    platform's own sets included — where the package scope (the control)
 *    lists one project package's slice;
 *  - its links keep the scope, so the editor and its breadcrumb return to the
 *    catalog;
 *  - re-gated for Setup (#22621 → A): a caller without `manage_metadata` gets
 *    no create affordance and the posture's own reason, and a holder gets the
 *    create affordance and no reason;
 *  - the active switch: per item, read from the row-state seam, written
 *    through it, disabled for a caller who cannot author, and an honest "—"
 *    for an item that has no row.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';

const PROJECT_PKG = 'com.example.showcase';
const TYPE = 'permission';

const ITEMS: Record<string, unknown>[] = [
  { name: 'admin_full_access', label: 'Administrator', _packageId: 'com.objectstack.plugin-security', _provenance: 'package' },
  { name: 'showcase_auditor', label: 'Showcase Auditor', _packageId: PROJECT_PKG, _provenance: 'package' },
  { name: 'env_authored_set', label: 'Environment Set' },
];

/** Stable singleton — the page's load effect keys on the client identity. */
const CLIENT = {
  list: async (type: string) =>
    type === 'package'
      ? [{ manifest: { id: PROJECT_PKG, scope: 'project', name: 'Showcase' } }]
      : type === TYPE
        ? ITEMS
        : [],
};

const ENTRY = { type: TYPE, label: 'Permission Set', allowOrgOverride: false, allowRuntimeCreate: true };

vi.mock('./useMetadata', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMetadataClient: () => CLIENT,
  useMetadataTypes: () => ({ loading: false, error: null, entries: [ENTRY] }),
}));

vi.mock('./i18n', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMetadataLocale: () => 'en-US',
}));

let canAuthor = true;
vi.mock('../../hooks/useCanAuthorMetadata', () => ({
  useCanAuthorMetadata: () => canAuthor,
}));

let posture: string | undefined = 'single';
vi.mock('../../hooks/useTenancyPosture', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTenancyPosture: () => posture,
}));

/** The catalog rows the switch reads: one per item but the environment one. */
const ROWS = [
  { id: 'ps_admin', name: 'admin_full_access', active: true },
  { id: 'ps_audit', name: 'showcase_auditor', active: false },
];
const ADAPTER = {
  find: vi.fn(async (object: string) => (object === 'sys_permission_set' ? { data: ROWS } : { data: [] })),
  update: vi.fn(async () => ({})),
};
vi.mock('@object-ui/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAdapter: () => ADAPTER,
}));

// Imported AFTER the mocks so the page picks them up.
import { MetadataResourceListPage } from './ResourceListPage';
import { t, tFormat, translateMetadataType } from './i18n';

beforeEach(() => {
  canAuthor = true;
  posture = 'single';
  ADAPTER.find.mockClear();
  ADAPTER.update.mockClear();
});
afterEach(cleanup);

function mount(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/apps/setup/metadata/${TYPE}${search}`]}>
      <MetadataResourceListPage type={TYPE} />
    </MemoryRouter>,
  );
}

/** The row link for an item, by its href (column 0 renders the name). */
const linkTo = (container: HTMLElement, name: string): HTMLAnchorElement | null =>
  container.querySelector(`a[href*="/${name}"]`);

describe('the environment scope lists the whole registry (objectui#7611)', () => {
  it('lists every item — the platform set included — where the package scope lists one slice', async () => {
    const env = mount('?scope=environment');
    await waitFor(() => expect(linkTo(env.container, 'admin_full_access')).not.toBeNull());
    expect(linkTo(env.container, 'showcase_auditor')).not.toBeNull();
    expect(linkTo(env.container, 'env_authored_set')).not.toBeNull();
    env.unmount();

    // Control: the package scope (no `scope` param) shows the project slice only.
    const pkg = mount('');
    await waitFor(() => expect(linkTo(pkg.container, 'showcase_auditor')).not.toBeNull());
    expect(linkTo(pkg.container, 'admin_full_access')).toBeNull();
    expect(linkTo(pkg.container, 'env_authored_set')).toBeNull();
  });

  it('keeps the scope on every item link', async () => {
    const { container } = mount('?scope=environment');
    await waitFor(() => expect(linkTo(container, 'admin_full_access')).not.toBeNull());
    for (const name of ['admin_full_access', 'showcase_auditor', 'env_authored_set']) {
      expect(linkTo(container, name)?.getAttribute('href')).toMatch(/\?scope=environment$/);
    }
  });
});

describe('re-gated for Setup (#22621 → A)', () => {
  it('a caller without manage_metadata gets the reason under `single` and no create affordance', async () => {
    canAuthor = false;
    mount('?scope=environment');
    const reason = await screen.findByTestId('catalog-readonly-reason');
    expect(reason).toHaveTextContent(
      tFormat('engine.catalog.readOnly.single', 'en-US', {
        type: translateMetadataType(TYPE, 'en-US', ENTRY.label),
      }),
    );
    expect(screen.queryByRole('button', { name: new RegExp(t('engine.list.create', 'en-US')) })).toBeNull();
  });

  it('under a wall the reason names the operator', async () => {
    canAuthor = false;
    posture = 'isolated';
    mount('?scope=environment');
    const reason = await screen.findByTestId('catalog-readonly-reason');
    expect(reason.textContent).toMatch(/platform operator/);
  });

  it('a holder gets the create affordance and no reason', async () => {
    mount('?scope=environment');
    await screen.findByRole('button', { name: new RegExp(t('engine.list.create', 'en-US')) });
    expect(screen.queryByTestId('catalog-readonly-reason')).toBeNull();
  });
});

describe('the active switch (row-state seam, pending the activation ledger)', () => {
  it('shows each item’s row state and an honest dash for an item with no row', async () => {
    mount('?scope=environment');
    const admin = await screen.findByTestId('catalog-active-admin_full_access');
    expect(admin).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('catalog-active-showcase_auditor')).toHaveAttribute('aria-checked', 'false');
    const none = screen.getByTestId('catalog-active-env_authored_set');
    expect(none).toHaveTextContent('—');
    expect(none).toHaveAttribute('title', t('engine.catalog.active.noRow', 'en-US'));
    expect(ADAPTER.find).toHaveBeenCalledWith('sys_permission_set', expect.objectContaining({ $select: ['id', 'name', 'active'] }));
  });

  it('flips the row through the data door, by its id', async () => {
    mount('?scope=environment');
    fireEvent.click(await screen.findByTestId('catalog-active-admin_full_access'));
    await waitFor(() => expect(ADAPTER.update).toHaveBeenCalledWith('sys_permission_set', 'ps_admin', { active: false }));
    await waitFor(() =>
      expect(screen.getByTestId('catalog-active-admin_full_access')).toHaveAttribute('aria-checked', 'false'),
    );
  });

  it('is disabled for a caller who cannot author', async () => {
    canAuthor = false;
    mount('?scope=environment');
    expect(await screen.findByTestId('catalog-active-admin_full_access')).toBeDisabled();
  });

  it('is absent outside the environment scope', async () => {
    const { container } = mount('');
    await waitFor(() => expect(linkTo(container, 'showcase_auditor')).not.toBeNull());
    expect(screen.queryByTestId('catalog-active-showcase_auditor')).toBeNull();
    expect(ADAPTER.find).not.toHaveBeenCalled();
  });
});
