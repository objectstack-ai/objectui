// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Approvals Inbox — the request drawer's "N eligible approver(s)" counts
 * people, not `pending_approvers` slots (objectui#12781).
 *
 * The approvals service keeps one slot per resolved approver entry, so one
 * person holding two of a node's positions fills two slots under the same
 * user id. The drawer's decision-progress block counted slots, so the stock
 * showcase's committee quorum read "3 eligible approvers" for one person.
 * It now counts the distinct addresses in the served slate, the rule
 * app-shell's `eligibleApproverCount` applies on the record and request pages.
 *
 * The translation stub returns the pack key and its interpolation arguments,
 * so each assertion names the row and its count rather than English prose.
 * The fixture rows are in the shape the approvals get serves: user-id slots,
 * a name for each id, the server's tally.
 *
 * No build artifact sits between the edit and this test: the root Vitest
 * config aliases every `@object-ui` specifier at that package's source, and
 * the page under test is this app's own source.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MePermissionsProvider, type MePermissionsResponse } from '@object-ui/permissions';

const APP = 'com.objectstack.account';

const { approvalsApiStub, setSlate, row, ADAPTER, AUTH, I18N } = vi.hoisted(() => {
  /** The pack key and its arguments (keys sorted), never the inline default. */
  const row = (key: string, args?: Record<string, unknown>): string => {
    const entries = Object.entries(args ?? {})
      .filter(([k]) => k !== 'defaultValue')
      .sort(([a], [b]) => a.localeCompare(b));
    return entries.length ? `${key} ${JSON.stringify(Object.fromEntries(entries))}` : key;
  };

  const NAMES: Record<string, string> = {
    u_nina: 'Nina Novak',
    u_pat: 'Pat Price',
    u_lee: 'Lee Lin',
    u_dev_admin: 'Dev Admin',
  };

  const request: Record<string, unknown> = {
    id: 'req_12781',
    process_name: 'showcase_expense_committee',
    process_label: 'High-Value Expense — Committee Quorum',
    object_name: 'showcase_expense_report',
    object_label: 'Expense Report',
    record_id: 'exp_1',
    record_title: 'EXP-DEMO',
    status: 'pending',
    submitter_id: 'u_2',
    submitter_name: 'Sam Submitter',
    submitted_at: '2026-10-16T00:00:00.000Z',
    payload: {},
  };

  const setSlate = (pending_approvers: string[], got: number, need: number) => {
    request.pending_approvers = pending_approvers;
    request.pending_approver_names = Object.fromEntries(pending_approvers.map((id) => [id, NAMES[id]]));
    request.decision_progress = { behavior: 'quorum', got, need };
  };

  const approvalsApiStub = {
    listRequests: vi.fn(async () => ({ data: [request], total: 1 })),
    getRequest: vi.fn(async () => ({ data: request })),
    listActions: vi.fn(async () => ({ data: [] })),
    approve: vi.fn(async () => ({ data: request, finalized: true })),
    reject: vi.fn(async () => ({ data: request, finalized: true })),
  };

  // STABLE singletons: a mocked hook handing back a fresh object per render
  // re-runs the page's load effect forever and the drawer never settles.
  const ADAPTER = { find: vi.fn(async () => ({ data: [{ id: 'exp_1' }] })) };
  const AUTH = { user: { id: 'u_1', email: 'approver@example.com' } };
  const I18N = {
    t: (key: string, options?: Record<string, unknown>) => row(key, options),
    language: 'en',
  };
  return { approvalsApiStub, setSlate, row, ADAPTER, AUTH, I18N };
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

/**
 * Open the drawer on the request through the `?request=` deep link, the way a
 * notification opens it, and return the decision-progress block.
 */
async function openProgress(slots: string[], got = 1, need = 2) {
  setSlate(slots, got, need);
  render(
    <MePermissionsProvider initialPermissions={permissionsPayload()}>
      <MemoryRouter initialEntries={[`/apps/${APP}/system/approvals?request=req_12781`]}>
        <Routes>
          <Route path="/apps/:appName/system/approvals" element={<ApprovalsInboxPage />} />
        </Routes>
      </MemoryRouter>
    </MePermissionsProvider>,
  );
  const dialog = await screen.findByRole('dialog');
  const bar = await within(dialog).findByRole('progressbar', { name: row('approvalsInbox.progressBar') });
  return { block: bar.parentElement as HTMLElement, bar };
}

afterEach(cleanup);

describe('Approvals Inbox — the drawer counts eligible approvers as distinct users (objectui#12781)', () => {
  it.each([
    ['one user in two slots among others', ['u_nina', 'u_dev_admin', 'u_dev_admin', 'u_lee'], 3],
    ['the stock showcase committee quorum: one user in all three slots', ['u_dev_admin', 'u_dev_admin', 'u_dev_admin'], 1],
  ])('%s: the label counts distinct users, not slots', async (_name, slots, people) => {
    const { block } = await openProgress(slots);

    expect(within(block).getByText(row('approvalsInbox.progressEligible', { count: people }))).toBeInTheDocument();
    expect(within(block).queryByText(row('approvalsInbox.progressEligible', { count: slots.length }))).toBeNull();
  });

  it('distinct users only: the count is the one the slot length always gave', async () => {
    const slots = ['u_nina', 'u_pat', 'u_lee'];
    const { block } = await openProgress(slots);

    expect(within(block).getByText(row('approvalsInbox.progressEligible', { count: slots.length }))).toBeInTheDocument();
  });

  it("the server's tally is drawn as served: got and need are untouched by the distinct count", async () => {
    const { block, bar } = await openProgress(['u_nina', 'u_dev_admin', 'u_dev_admin', 'u_lee'], 1, 2);

    expect(within(block).getByText(row('approvalsInbox.progressApprovals', { got: 1, need: 2 }))).toBeInTheDocument();
    expect(bar).toHaveAttribute('aria-valuemax', '2');
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(bar.children).toHaveLength(2);
  });
});
