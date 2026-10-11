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
 *  - the active switch: per item, the activation ledger's state (no row is
 *    active) with no catalog row read, written through the activation door by
 *    name, the door's refusal shown in its own words, disabled for a caller
 *    who cannot author, and disabled with the reason on an audience anchor.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
// The switch column waits on `audienceAnchorsOf`'s dynamic import of this exact
// specifier. Loaded here, its cost lands in the import phase rather than inside
// a `findBy` window (AGENTS.md, test discipline).
import '@objectstack/spec/identity';

const PROJECT_PKG = 'com.example.showcase';
const TYPE = 'permission';

const POSITIONS: Record<string, unknown>[] = [
  { name: 'everyone', label: 'Everyone', _packageId: 'com.objectstack.plugin-security', _provenance: 'package' },
  { name: 'auditor', label: 'Auditor', _packageId: PROJECT_PKG, _provenance: 'package' },
];

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
        : type === 'position'
          ? POSITIONS
          : [],
};

const ENTRY = { type: TYPE, label: 'Permission Set', allowOrgOverride: false, allowRuntimeCreate: true };
const POSITION_ENTRY = { type: 'position', label: 'Position', allowOrgOverride: false, allowRuntimeCreate: true };

vi.mock('./useMetadata', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMetadataClient: () => CLIENT,
  useMetadataTypes: () => ({ loading: false, error: null, entries: [ENTRY, POSITION_ENTRY] }),
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

/** The activation ledger the switch reads: one row, switching a set off. */
let ledgerRows: Record<string, unknown>[] = [];
/** What the activation door answers. */
let doorAnswer: { status: number; body: unknown } = { status: 200, body: {} };
/** Every request the page sent through `fetch`. */
const requests: Array<{ url: string; method: string; body?: string }> = [];

// Imported AFTER the mocks so the page picks them up.
import { MetadataResourceListPage } from './ResourceListPage';
import { t, tFormat, translateMetadataType } from './i18n';

beforeEach(() => {
  canAuthor = true;
  posture = 'single';
  ledgerRows = [{ metadata_type: 'permission', name: 'showcase_auditor', active: false }];
  doorAnswer = { status: 200, body: {} };
  requests.length = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      requests.push({ url: String(url), method, body: init?.body as string | undefined });
      const json = (status: number, body: unknown) =>
        new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
      if (method === 'GET' && String(url).startsWith('/api/v1/data/sys_metadata_activation')) {
        return json(200, { object: 'sys_metadata_activation', records: ledgerRows, hasMore: false });
      }
      if (method === 'POST' && String(url).startsWith('/api/v1/security/_activation/')) {
        return json(doorAnswer.status, doorAnswer.body);
      }
      return json(404, { success: false, error: { message: `unexpected ${method} ${url}` } });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mount(search: string, type: string = TYPE) {
  return render(
    <MemoryRouter initialEntries={[`/apps/setup/metadata/${type}${search}`]}>
      <MetadataResourceListPage type={type} />
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

describe('the active switch (the activation ledger, through its door)', () => {
  it("shows each item's ledger state, an item with no row as active, and reads no catalog row", async () => {
    mount('?scope=environment');
    const admin = await screen.findByTestId('catalog-active-admin_full_access');
    expect(admin).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('catalog-active-showcase_auditor')).toHaveAttribute('aria-checked', 'false');
    // An environment-authored set has no catalog row, and is switchable all the same.
    expect(screen.getByTestId('catalog-active-env_authored_set')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('catalog-active-env_authored_set')).not.toBeDisabled();
    expect(requests.map((r) => r.url)).toContain('/api/v1/data/sys_metadata_activation?top=1000');
    expect(requests.some((r) => /sys_permission_set|sys_position/.test(r.url))).toBe(false);
  });

  it('switches through the activation door, by the item name', async () => {
    doorAnswer = { status: 200, body: { success: true, data: { type: 'permission', name: 'showcase_auditor', enabled: true } } };
    mount('?scope=environment');
    fireEvent.click(await screen.findByTestId('catalog-active-showcase_auditor'));
    await waitFor(() =>
      expect(screen.getByTestId('catalog-active-showcase_auditor')).toHaveAttribute('aria-checked', 'true'),
    );
    expect(requests.filter((r) => r.method === 'POST')).toEqual([
      { url: '/api/v1/security/_activation/permission/showcase_auditor', method: 'POST', body: '{"enabled":true}' },
    ]);
  });

  it("shows the door's refusal in the server's own words, and leaves the switch as it was", async () => {
    const refusal = 'A refusal sentence the server wrote.';
    doorAnswer = { status: 403, body: { success: false, error: { code: 'PERMISSION_DENIED', message: refusal, httpStatus: 403 } } };
    mount('?scope=environment');
    fireEvent.click(await screen.findByTestId('catalog-active-admin_full_access'));
    expect(
      await screen.findByText(tFormat('engine.catalog.active.failed', 'en-US', { message: refusal })),
    ).toBeInTheDocument();
    expect(screen.getByTestId('catalog-active-admin_full_access')).toHaveAttribute('aria-checked', 'true');
  });

  it('is disabled for a caller who cannot author, and states the state without offering a click', async () => {
    canAuthor = false;
    mount('?scope=environment');
    const on = await screen.findByTestId('catalog-active-admin_full_access');
    expect(on).toBeDisabled();
    expect(on).toHaveAttribute('aria-label', t('engine.catalog.status.active', 'en-US'));
    expect(screen.getByTestId('catalog-active-showcase_auditor')).toHaveAttribute(
      'aria-label',
      t('engine.catalog.status.inactive', 'en-US'),
    );
  });

  it('on positions, an audience anchor is a disabled switch that says why; CONTROL: another position is live', async () => {
    mount('?scope=environment', 'position');
    const anchor = await screen.findByTestId('catalog-active-everyone');
    expect(anchor).toBeDisabled();
    expect(anchor).toHaveAttribute('aria-label', t('engine.catalog.active.anchor', 'en-US'));
    expect(anchor.parentElement).toHaveAttribute('title', t('engine.catalog.active.anchor', 'en-US'));
    expect(screen.getByTestId('catalog-active-auditor')).not.toBeDisabled();
  });

  it('is absent outside the environment scope', async () => {
    const { container } = mount('');
    await waitFor(() => expect(linkTo(container, 'showcase_auditor')).not.toBeNull());
    expect(screen.queryByTestId('catalog-active-showcase_auditor')).toBeNull();
    expect(requests.some((r) => r.url.includes('sys_metadata_activation'))).toBe(false);
  });
});
