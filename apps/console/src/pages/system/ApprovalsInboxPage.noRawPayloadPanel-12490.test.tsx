// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Approvals Inbox — the side sheet has no raw payload panel, for ANY viewer
 * (objectui#12490).
 *
 * ## What changed
 *
 * The detail drawer used to end with a collapsed "Raw data (JSON)" panel: the
 * submitted record's whole snapshot as indented JSON, with a copy button. Since
 * objectui#5553 it rendered only for a holder of the platform-admin-only
 * capability `studio.access`. The maintainer then ruled the panel has no
 * business need at all — the person handling an approval decides from the
 * structured summary, the chain, the activity and the actions, never from JSON
 * — and ordered it deleted rather than kept behind a gate or ported to another
 * surface. So no viewer gets it: not a business approver, and not a platform
 * operator either.
 *
 * ## Why the `studio.access` holder is the case that matters
 *
 * Every other principal below was already denied by the old gate, so for them
 * absence held before this change too. The holder is the one viewer for whom
 * the panel used to render; that row is the one that goes red if the panel
 * comes back gated as it was. The other rows go red only if it comes back
 * ungated (the objectui#5553 leak itself), and they are kept so the suite says
 * "every viewer" rather than "this one viewer".
 *
 * ## Why every case carries a counter-probe
 *
 * The acceptance condition is that something does NOT render, and a suite that
 * renders nothing at all reproduces that perfectly. So each case also asserts
 * the drawer it is looking inside — the process label and a business summary
 * value. An empty render fails the counter-probe; a panel that came back fails
 * the absence assertions. Neither can pass alone.
 *
 * ## The witnesses
 *
 * `created_by` and `organization_id` are bookkeeping columns to the page's
 * `isBookkeepingKey` (`@object-ui/types`' `isSystemManagedField`), so the
 * summary card drops them: their values could reach the DOM only through the
 * raw panel. That makes them exact witnesses for "a raw dump rendered", not
 * proxies. (Both are also long enough to trip the summary's opaque-id filter,
 * so neither can slip in by a second route.) The panel drew its JSON in a
 * `pre` element, and the drawer draws no other, so "no `pre` in the drawer" is
 * the shape half of the same assertion.
 *
 * No build artifact sits between the edit and this test: the root Vitest config
 * aliases every `@object-ui` specifier at that package's source directory, and
 * the page under test is this app's own source.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MePermissionsProvider, type MePermissionsResponse } from '@object-ui/permissions';

const APP = 'com.objectstack.account';

/** The retired panel's summary label, as the page used to spell it through `tr`. */
const PANEL_LABEL = 'Raw data (JSON)';

/** Values that could only reach the DOM via a raw dump (see header). */
const AUDIT_WITNESS = 'usr_audit_witness';
const ORG_WITNESS = 'org_audit_witness';

/** A business field the approver is meant to decide from — the counter-anchor. */
const BUSINESS_FIELD = 'Q3 clinical supplies';

const { approvalsApiStub, adapterFind, ADAPTER, AUTH, I18N } = vi.hoisted(() => {
  const row = {
    id: 'req_1',
    process_name: 'purchase_approval',
    process_label: 'Purchase Approval',
    object_name: 'showcase_purchase',
    object_label: 'Purchase',
    record_id: 'po_1',
    record_title: 'PO-4417',
    status: 'pending',
    pending_approvers: ['u_1'],
    submitter_id: 'u_2',
    submitter_name: 'Sam Submitter',
    submitted_at: '2026-08-20T00:00:00.000Z',
    payload: {
      subject: 'Q3 clinical supplies',
      created_by: 'usr_audit_witness',
      organization_id: 'org_audit_witness',
    },
  };

  const adapterFind = vi.fn(async () => ({ data: [{ id: 'po_1' }] }));

  const approvalsApiStub = {
    listRequests: vi.fn(async () => ({ data: [row], total: 1 })),
    getRequest: vi.fn(async () => ({ data: row })),
    listActions: vi.fn(async () => ({ data: [] })),
    approve: vi.fn(async () => ({ data: row, finalized: true })),
    reject: vi.fn(async () => ({ data: row, finalized: true })),
  };

  // STABLE singletons: a mocked hook handing back a fresh object per render
  // re-runs the page's load effect forever and the drawer never settles.
  const ADAPTER = { find: adapterFind };
  const AUTH = { user: { id: 'u_1', email: 'approver@example.com' } };
  const I18N = {
    t: (key: string, options?: Record<string, unknown>) => String(options?.defaultValue ?? key),
    language: 'en',
  };

  return { approvalsApiStub, adapterFind, ADAPTER, AUTH, I18N };
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

/**
 * `/me/permissions` as the provider receives it. `systemPermissions` is passed
 * through EXACTLY as given — `undefined` stays absent from the payload rather
 * than becoming `[]`, because "never reported" and "reported, holds nothing"
 * are different facts (objectui#4656), and the old gate answered them apart.
 */
function permissionsPayload(systemPermissions: string[] | undefined): MePermissionsResponse {
  const base: MePermissionsResponse = {
    authenticated: true,
    userId: 'u_1',
    tenantId: 't_1',
    roles: [],
    permissionSets: [],
    objects: {},
    fields: {},
  };
  return systemPermissions === undefined ? base : { ...base, systemPermissions };
}

/**
 * Render the inbox with the drawer already open on `req_1`, for a principal
 * holding `systemPermissions`. The `?request=` deep link is the page's own
 * notification entry point, so the drawer opens the way production opens it.
 */
function renderDrawerFor(systemPermissions: string[] | undefined) {
  return render(
    <MePermissionsProvider initialPermissions={permissionsPayload(systemPermissions)}>
      <MemoryRouter initialEntries={[`/apps/${APP}/system/approvals?request=req_1`]}>
        <Routes>
          <Route path="/apps/:appName/system/approvals" element={<ApprovalsInboxPage />} />
        </Routes>
      </MemoryRouter>
    </MePermissionsProvider>,
  );
}

/** The open drawer, once the deep-linked request has actually loaded into it. */
async function openedDrawer(): Promise<HTMLElement> {
  const dialog = await screen.findByRole('dialog');
  await within(dialog).findByText('Purchase Approval');
  return dialog;
}

/** No raw dump of the snapshot, by label, by value, or by shape. */
function expectNoRawPayloadPanel(dialog: HTMLElement): void {
  expect(within(dialog).queryByText(PANEL_LABEL)).not.toBeInTheDocument();
  expect(within(dialog).queryByText(new RegExp(AUDIT_WITNESS))).not.toBeInTheDocument();
  expect(within(dialog).queryByText(new RegExp(ORG_WITNESS))).not.toBeInTheDocument();
  expect(dialog.querySelector('pre')).toBeNull();
}

/**
 * The counter-probe, as one assertion: this drawer really did render its
 * business content, so "the panel is absent" can never be satisfied by an
 * empty render.
 */
function expectBusinessDrawerRendered(dialog: HTMLElement): void {
  expect(within(dialog).getByText('Purchase Approval')).toBeInTheDocument();
  expect(within(dialog).getByText(BUSINESS_FIELD)).toBeInTheDocument();
}

beforeEach(() => {
  adapterFind.mockClear();
  for (const fn of Object.values(approvalsApiStub)) fn.mockClear();
});
afterEach(cleanup);

describe('Approvals Inbox — no raw payload panel for any viewer (objectui#12490)', () => {
  it('shows a studio.access holder no raw payload panel, in a drawer that is otherwise intact', async () => {
    // The one principal the old gate let through: a platform operator.
    renderDrawerFor(['studio.access']);
    const dialog = await openedDrawer();

    expectNoRawPayloadPanel(dialog);
    expectBusinessDrawerRendered(dialog);
  });

  it.each([
    ['a business approver holding setup.access', ['setup.access']],
    ['a principal whose capability set is reported empty', []],
    ['a principal whose capability set is never reported', undefined],
  ] as const)('shows %s no raw payload panel either', async (_who, systemPermissions) => {
    renderDrawerFor(systemPermissions === undefined ? undefined : [...systemPermissions]);
    const dialog = await openedDrawer();

    expectNoRawPayloadPanel(dialog);
    expectBusinessDrawerRendered(dialog);
  });
});
