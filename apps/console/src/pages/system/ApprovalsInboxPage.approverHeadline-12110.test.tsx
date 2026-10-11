// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Approvals drawer — the approver chip names a position by its label, and the
 * headline figure is the object's declared amount (objectui#12110 item 6,
 * finding C-18 of the HotCRM browser pass).
 *
 * ## The approver chip
 *
 * A `position:<name>` approver the server did not resolve went through the
 * page's `formatIdentity`, which middle-truncates anything over 14 characters:
 * `position:sales_manager` read `positi…ager`. It now reads the position's
 * label from the console's metadata store — the `position` registry
 * (ADR-0131 D3), the same `ensureType('position')` read Setup's sharing-rule
 * picker makes, fetched once per session and shared — and the prettified
 * machine name when the registry has no such item. The raw reference stays in
 * the chip's `title`.
 *
 * ## The headline figure
 *
 * `decisionAmountEntry` took the first payload key matching an amount-ish
 * pattern. HotCRM's account declares `annual_revenue` as a `currency` field
 * and `child_account_revenue` as a `summary` roll-up of its children, and the
 * drawer led with "Child Account Revenue 0". A field the object DECLARES as an
 * amount (`currency`) now wins over a name match, and a name match is never
 * headlined when its value is zero.
 *
 * Fixtures are the HotCRM account's own two declarations (`account.object.ts`).
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MePermissionsProvider, type MePermissionsResponse } from '@object-ui/permissions';
import { MetadataCtx, type MetadataContextValue } from '@object-ui/react';

const APP = 'com.example.crm';

const { approvalsApiStub, getObjectSchema, ADAPTER, AUTH, I18N, SCHEMA } = vi.hoisted(() => {
  const SCHEMA = {
    name: 'crm_account',
    label: 'Account',
    fields: {
      name: { type: 'text', label: 'Account Name' },
      annual_revenue: { type: 'currency', label: 'Annual Revenue' },
      child_account_revenue: {
        type: 'summary',
        label: 'Child Account Revenue',
        summaryOperations: { object: 'crm_account', field: 'annual_revenue', function: 'sum' },
      },
      industry: { type: 'text', label: 'Industry' },
    },
  };
  const getObjectSchema = vi.fn(async (): Promise<unknown> => SCHEMA);
  type Row = Record<string, unknown>;
  const approvalsApiStub = {
    listRequests: vi.fn(async (): Promise<{ data: Row[]; total: number }> => ({ data: [], total: 0 })),
    getRequest: vi.fn(async (): Promise<{ data: Row | null }> => ({ data: null })),
    listActions: vi.fn(async () => ({ data: [] })),
    approve: vi.fn(async () => ({ data: null, finalized: true })),
    reject: vi.fn(async () => ({ data: null, finalized: true })),
  };
  const ADAPTER = { find: vi.fn(async () => ({ data: [] })), getObjectSchema };
  const AUTH = { user: { id: 'u_1', email: 'approver@example.com' } };
  const I18N = {
    t: (key: string, options?: Record<string, unknown>) => String(options?.defaultValue ?? key),
    language: 'en',
  };
  return { approvalsApiStub, getObjectSchema, ADAPTER, AUTH, I18N, SCHEMA };
});

vi.mock('@object-ui/i18n', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useObjectTranslation: () => I18N,
}));

vi.mock('@object-ui/auth', async (importOriginal) => {
  const authFetch = vi.fn(async () => new Response('{}', { status: 200 }));
  return {
    ...(await importOriginal<Record<string, unknown>>()),
    useAuth: () => AUTH,
    createAuthenticatedFetch: () => authFetch,
    TokenStorage: { get: () => null },
  };
});

vi.mock('@object-ui/app-shell', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAdapter: () => ADAPTER,
  DeclaredActionsBar: () => null,
  isViaOverrideRow: () => false,
}));

vi.mock('../../services/approvalsApi', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  approvalsApi: approvalsApiStub,
}));

// Imported after the mocks so the page picks them up.
import { ApprovalsInboxPage } from './ApprovalsInboxPage';

function permissionsPayload(): MePermissionsResponse {
  return {
    authenticated: true,
    userId: 'u_1',
    tenantId: 't_1',
    roles: [],
    permissionSets: [],
    objects: {},
    fields: {},
    systemPermissions: ['setup.access'],
  };
}

/** The `position` registry as `GET /api/v1/meta/position` serves it. */
const POSITIONS = [
  { name: 'sales_manager', label: 'Regional Sales Manager' },
  { name: 'auditor', label: 'Auditor' },
];

/** A metadata store answering the `position` registry; STABLE across renders. */
function makeStore(positions: unknown[]): MetadataContextValue & { ensureType: ReturnType<typeof vi.fn> } {
  return {
    apps: [], objects: [], dashboards: [], reports: [], pages: [],
    loading: false, error: null,
    refresh: async () => {},
    invalidate: () => {},
    ensureType: vi.fn(async (type: string) => (type === 'position' ? positions : [])),
    getItem: async () => null,
    getItemsByType: () => [],
  };
}

function request(over: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 'req_1',
    status: 'pending',
    process_name: 'crm_account_credit',
    process_label: 'Credit Limit Review',
    object_name: 'crm_account',
    object_label: 'Account',
    record_id: 'acc_1',
    record_title: 'Fabrikam',
    submitter_id: 'u_9',
    submitter_name: 'Dev Admin',
    submitted_at: '2026-10-06T05:00:00.000Z',
    pending_approvers: ['position:sales_manager'],
    payload: { name: 'Fabrikam', industry: 'Retail' },
    ...over,
  };
}

async function openedDrawer(row: Record<string, unknown>, store: MetadataContextValue | null): Promise<HTMLElement> {
  approvalsApiStub.listRequests.mockResolvedValue({ data: [row], total: 1 });
  approvalsApiStub.getRequest.mockResolvedValue({ data: row });
  const page = (
    <MePermissionsProvider initialPermissions={permissionsPayload()}>
      <MemoryRouter initialEntries={[`/apps/${APP}/system/approvals?request=${String(row.id)}`]}>
        <Routes>
          <Route path="/apps/:appName/system/approvals" element={<ApprovalsInboxPage />} />
        </Routes>
      </MemoryRouter>
    </MePermissionsProvider>
  );
  render(store ? <MetadataCtx.Provider value={store}>{page}</MetadataCtx.Provider> : page);
  const dialog = await screen.findByRole('dialog');
  await within(dialog).findByText(String(row.process_label));
  return dialog;
}

const chip = (dialog: HTMLElement, ref: string) => within(dialog).getByTitle(ref);

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  getObjectSchema.mockClear();
  getObjectSchema.mockImplementation(async () => SCHEMA);
  for (const fn of Object.values(approvalsApiStub)) fn.mockClear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Approvals drawer — a position approver reads as the position (objectui#12110 item 6)', () => {
  it('THE DEFECT — `position:sales_manager` reads the registry label, never "positi…ager"', async () => {
    const store = makeStore(POSITIONS);
    const dialog = await openedDrawer(request({}), store);
    await waitFor(() => expect(chip(dialog, 'position:sales_manager')).toHaveTextContent('Regional Sales Manager'));
    expect(within(dialog).queryByText(/positi…ager/)).toBeNull();
    expect(store.ensureType).toHaveBeenCalledWith('position');
  });

  it('a position the registry does not carry reads as its prettified machine name', async () => {
    const dialog = await openedDrawer(request({ pending_approvers: ['position:regional_controller'] }), makeStore([]));
    await waitFor(() => expect(chip(dialog, 'position:regional_controller')).toHaveTextContent('Regional Controller'));
    expect(within(dialog).queryByText(/positi…/)).toBeNull();
  });

  it('CONTROL: the server\'s own name still wins, and the registry is not asked', async () => {
    const store = makeStore(POSITIONS);
    const dialog = await openedDrawer(
      request({ pending_approver_names: { 'position:sales_manager': 'Sales Manager (served)' } }),
      store,
    );
    expect(chip(dialog, 'position:sales_manager')).toHaveTextContent('Sales Manager (served)');
    expect(store.ensureType).not.toHaveBeenCalledWith('position');
  });
});

describe('Approvals drawer — the headline is the declared amount (objectui#12110 item 6)', () => {
  const lead = (dialog: HTMLElement) => dialog.querySelector('[data-summary-lead]');

  it('THE DEFECT — a zero roll-up named like an amount does not outrank the declared currency field', async () => {
    const dialog = await openedDrawer(
      request({ payload: { name: 'Fabrikam', child_account_revenue: 0, annual_revenue: 5000000, industry: 'Retail' } }),
      makeStore(POSITIONS),
    );
    await waitFor(() => expect(lead(dialog)?.getAttribute('data-summary-lead')).toBe('annual_revenue'));
    expect(lead(dialog)?.children[0]?.textContent).toBe('Annual Revenue');
  });

  it('a zero from a name match alone is never the headline', async () => {
    const dialog = await openedDrawer(
      request({ payload: { name: 'Fabrikam', child_account_revenue: 0, industry: 'Retail' } }),
      makeStore(POSITIONS),
    );
    await waitFor(() => expect(getObjectSchema).toHaveBeenCalled());
    // Settled on the declared labels before reading the absence.
    await waitFor(() => expect(dialog.querySelector('[data-summary-field="industry"]')).not.toBeNull());
    expect(lead(dialog)).toBeNull();
  });

  it('CONTROL: the declared amount field leads with its own zero — that zero is the record\'s amount', async () => {
    const dialog = await openedDrawer(
      request({ payload: { name: 'Fabrikam', annual_revenue: 0, industry: 'Retail' } }),
      makeStore(POSITIONS),
    );
    await waitFor(() => expect(lead(dialog)?.getAttribute('data-summary-lead')).toBe('annual_revenue'));
  });
});
