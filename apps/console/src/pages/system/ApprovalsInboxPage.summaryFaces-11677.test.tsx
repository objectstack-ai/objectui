// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Approvals drawer — the record summary card renders the object's field
 * metadata: its labels, and each value through the record page's own cell
 * face (objectui#11677).
 *
 * ## The defect, as the 2026-10-06 showcase dogfood measured it
 *
 * The summary card titled every row with `payload_labels[key] ?? prettifyKey(key)`
 * and printed every value through `formatPayloadValue`, which knows no field
 * type. So "Invoice Dual Sign-off" read `Status sent` and `Region emea` (the
 * stored option values, where the invoice list shows the "Sent" / "EMEA"
 * labels) and `Issued On 2026-07-23` (the stored date string). Its card also
 * carried two rows labelled "Owner": the author's `owner` text field and the
 * platform-injected `owner_id` lookup — both DECLARE the label "Owner", and the
 * row `key` was that label, so React logged "two children with the same key".
 *
 * ## What the two fixtures are
 *
 * The two requests the dogfood opened. Their SHAPE was read from a live
 * showcase boot: `GET /api/v1/approvals/requests` and
 * `GET /api/v1/meta/object/:name`. That covers the snapshot key order (the
 * injected system columns first), the nulls, the hydrated `account`,
 * `payload_display` resolving `owner_id` alone, and `payload_labels` giving
 * both `owner` and `owner_id` the label "Owner". The metadata read answers
 * `total` as "Total" (the showcase translation bundle) while `payload_labels`
 * says "Subtotal" (the object's own label). The VALUES are the invoice the
 * dogfood opened: `INV-1010`, `emea`, issued 2026-07-23. A fresh boot picks a
 * different `sent` invoice.
 *
 * ⚠️ One reading in the card was corrected by the fixture, not carried into
 * it: the expense card's `Approved 0` is not a boolean. `showcase_expense_report`
 * declares no boolean at all; "Approved" is the label of `approved_amount`, a
 * `summary` roll-up whose value for the demo report is 0. Its record-page face
 * is the summary cell, and that is what is pinned below.
 *
 * ## How "the same face" is asserted
 *
 * Every value is compared with what the record page's own dispatch draws for
 * the same declaration and the same stored value — `getCellRenderer(
 * resolveCellRendererType(def))` from `@object-ui/fields`, the chain
 * `DetailSection` renders a field through — rendered standalone in this same
 * environment. Literal anchors (`EMEA`, `Sent`, the raw strings' absence) sit
 * beside each comparison, so a face that renders nothing cannot pass by
 * agreeing with an oracle that also renders nothing.
 *
 * ## Why `setup.access`
 *
 * Same reason as `ApprovalsInboxPage.hiddenFieldTrim.test.tsx`: a real grant
 * that is not platform-admin-only, so the raw-JSON panel (objectui#5553) never
 * renders and the summary card is the only door under test.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MePermissionsProvider, type MePermissionsResponse } from '@object-ui/permissions';
import { getCellRenderer, resolveCellRendererType } from '@object-ui/fields';

const APP = 'com.example.showcase';

const { approvalsApiStub, getObjectSchema, ADAPTER, AUTH, I18N, INVOICE, EXPENSE, SCHEMAS } = vi.hoisted(() => {
  /** The system columns the registry injects on a business object. */
  const injected = {
    owner_id: { type: 'lookup', reference: 'sys_user', label: 'Owner', readonly: false, system: true },
    owning_business_unit_id: {
      type: 'lookup', reference: 'sys_business_unit', label: 'Owning Business Unit',
      hidden: true, readonly: true, system: true,
    },
    created_at: { type: 'datetime', label: 'Created At', readonly: true, system: true },
    created_by: { type: 'lookup', reference: 'sys_user', label: 'Created By', readonly: true, system: true },
    updated_at: { type: 'datetime', label: 'Last Modified At', readonly: true, system: true },
    updated_by: { type: 'lookup', reference: 'sys_user', label: 'Last Modified By', readonly: true, system: true },
  };

  const SCHEMAS: Record<string, unknown> = {
    showcase_invoice: {
      name: 'showcase_invoice',
      label: 'Invoice',
      fields: {
        ...injected,
        name: { type: 'text', label: 'Invoice Number' },
        account: { type: 'lookup', reference: 'showcase_account', label: 'Account' },
        contact: { type: 'lookup', reference: 'showcase_contact', label: 'Contact' },
        owner: { type: 'text', label: 'Owner' },
        region: {
          type: 'select', label: 'Region',
          options: [
            { label: 'AMER', value: 'amer' },
            { label: 'EMEA', value: 'emea' },
            { label: 'APAC', value: 'apac' },
          ],
        },
        status: {
          type: 'select', label: 'Status',
          options: [
            { label: 'Draft', value: 'draft', color: '#94A3B8' },
            { label: 'Sent', value: 'sent', color: '#3B82F6' },
            { label: 'Paid', value: 'paid', color: '#10B981' },
            { label: 'Void', value: 'void', color: '#EF4444' },
          ],
        },
        issued_on: { type: 'date', label: 'Issued On' },
        tax_rate: { type: 'number', label: 'Tax Rate (%)' },
        paid_on: { type: 'date', label: 'Paid On' },
        // The metadata read serves the translation bundle's label; the
        // server's `payload_labels` carries the object's own "Subtotal".
        total: { type: 'summary', label: 'Total' },
      },
    },
    showcase_expense_report: {
      name: 'showcase_expense_report',
      label: 'Expense Report',
      fields: {
        ...injected,
        name: { type: 'text', label: 'Report Title' },
        employee: { type: 'text', label: 'Employee' },
        status: {
          type: 'select', label: 'Status',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Submitted', value: 'submitted' },
            { label: 'Approved', value: 'approved' },
            { label: 'Reimbursed', value: 'reimbursed' },
          ],
        },
        submitted_on: { type: 'date', label: 'Submitted On' },
        total_amount: { type: 'summary', label: 'Total' },
        approved_amount: { type: 'summary', label: 'Approved' },
        reimbursable_amount: { type: 'summary', label: 'Reimbursable' },
        line_count: { type: 'summary', label: 'Lines' },
        rejected_count: { type: 'summary', label: 'Rejected' },
        over_limit_count: { type: 'summary', label: 'Over $500' },
      },
    },
  };

  /** The label per payload key the server sends (`resolveFieldLabels`). */
  const labelsOf = (object: string, payload: Record<string, unknown>) => {
    const fields = (SCHEMAS[object] as { fields: Record<string, { label?: string }> }).fields;
    const out: Record<string, string> = {};
    for (const k of Object.keys(payload)) if (fields[k]?.label) out[k] = fields[k].label as string;
    return out;
  };

  /** The injected columns, first in the snapshot, as the live read returned them. */
  const head = (id: string) => ({
    id,
    created_at: '2026-10-06T06:44:23.359Z',
    updated_at: '2026-10-06T06:44:24.469Z',
    organization_id: null,
    created_by: null,
    updated_by: null,
    owner_id: 'rOrg4X8TWQKqZDDLH3dH7JDhSZ69dEwm',
    owning_business_unit_id: null,
  });

  const invoicePayload = {
    ...head('8XdUnlTpGrRx6nqZ'),
    name: 'INV-1010',
    account: { id: 'da67WkM9ylVrUi96', name: 'Fabrikam', status: 'active' },
    contact: null,
    owner: 'grace@example.com',
    region: 'emea',
    status: 'sent',
    issued_on: '2026-07-23',
    tax_rate: 20,
    paid_on: null,
    total: 0,
  };

  const expensePayload = {
    ...head('H7m0glScJ9bWJGrJ'),
    name: 'EXP-DEMO',
    employee: 'Grace Hopper',
    status: 'submitted',
    submitted_on: '2026-10-05',
    total_amount: 8900,
    approved_amount: 0,
    reimbursable_amount: 8900,
    line_count: 4,
    rejected_count: 0,
    over_limit_count: 4,
  };

  const base = {
    status: 'pending',
    pending_approvers: ['u_1', 'u_2'],
    submitter_id: 'u_9',
    submitter_name: 'Dev Admin',
    submitted_at: '2026-10-06T05:00:00.000Z',
  };

  const INVOICE: Record<string, unknown> = {
    ...base,
    id: 'req_invoice',
    process_name: 'showcase_invoice_signoff',
    process_label: 'Invoice Dual Sign-off',
    object_name: 'showcase_invoice',
    object_label: 'Invoice',
    record_id: invoicePayload.id,
    record_title: 'INV-1010',
    payload: invoicePayload,
    payload_labels: { ...labelsOf('showcase_invoice', invoicePayload), total: 'Subtotal' },
    payload_display: { owner_id: 'Dev Admin' },
  };

  const EXPENSE: Record<string, unknown> = {
    ...base,
    id: 'req_expense',
    process_name: 'showcase_committee_quorum',
    process_label: 'High-Value Expense — Committee Quorum',
    object_name: 'showcase_expense_report',
    object_label: 'Expense Report',
    record_id: expensePayload.id,
    record_title: 'EXP-DEMO',
    payload: expensePayload,
    payload_labels: labelsOf('showcase_expense_report', expensePayload),
    payload_display: { owner_id: 'Dev Admin' },
  };

  const getObjectSchema = vi.fn(async (name: string): Promise<unknown> => SCHEMAS[name] ?? { fields: {} });

  const approvalsApiStub = {
    listRequests: vi.fn(async () => ({ data: [INVOICE], total: 1 })),
    getRequest: vi.fn(async () => ({ data: INVOICE })),
    listActions: vi.fn(async () => ({ data: [] })),
    approve: vi.fn(async () => ({ data: INVOICE, finalized: true })),
    reject: vi.fn(async () => ({ data: INVOICE, finalized: true })),
  };

  // STABLE singletons: a mocked hook handing back a fresh object per render
  // re-runs the page's load effect forever and the drawer never settles.
  const ADAPTER = { find: vi.fn(async () => ({ data: [] })), getObjectSchema };
  const AUTH = { user: { id: 'u_1', email: 'approver@example.com' } };
  const I18N = {
    t: (key: string, options?: Record<string, unknown>) => String(options?.defaultValue ?? key),
    language: 'en',
  };

  return { approvalsApiStub, getObjectSchema, ADAPTER, AUTH, I18N, INVOICE, EXPENSE, SCHEMAS };
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

/** Every `console.error` the page logged — React's duplicate-key warning lands here. */
let errors: string[] = [];

beforeEach(() => {
  errors = [];
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(args.map((a) => String(a)).join(' '));
  });
  getObjectSchema.mockClear();
  getObjectSchema.mockImplementation(async (name: string) => SCHEMAS[name] ?? { fields: {} });
  for (const fn of Object.values(approvalsApiStub)) fn.mockClear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function useRequest(row: Record<string, unknown>) {
  approvalsApiStub.listRequests.mockResolvedValue({ data: [row], total: 1 });
  approvalsApiStub.getRequest.mockResolvedValue({ data: row });
}

/** Open the drawer the way a notification opens it — the `?request=` deep link. */
async function openedDrawer(row: Record<string, unknown>): Promise<HTMLElement> {
  render(
    <MePermissionsProvider initialPermissions={permissionsPayload()}>
      <MemoryRouter initialEntries={[`/apps/${APP}/system/approvals?request=${String(row.id)}`]}>
        <Routes>
          <Route path="/apps/:appName/system/approvals" element={<ApprovalsInboxPage />} />
        </Routes>
      </MemoryRouter>
    </MePermissionsProvider>,
  );
  const dialog = await screen.findByRole('dialog');
  await within(dialog).findByText(String(row.process_label));
  return dialog;
}

/** The summary card's rows, as `{ field key → { label, value } }`. */
function summaryRows(dialog: HTMLElement): Map<string, { label: string; value: string }> {
  const out = new Map<string, { label: string; value: string }>();
  for (const row of dialog.querySelectorAll('[data-summary-field]')) {
    const [label, value] = Array.from(row.children);
    out.set(row.getAttribute('data-summary-field') as string, {
      label: (label?.textContent ?? '').trim(),
      value: (value?.textContent ?? '').trim(),
    });
  }
  return out;
}

/**
 * What the record page draws for this declaration and this stored value — the
 * `DetailSection` dispatch, rendered standalone in this environment.
 */
function recordPageFace(object: string, field: string, value: unknown): string {
  const def = { ...(SCHEMAS[object] as { fields: Record<string, Record<string, unknown>> }).fields[field], name: field };
  const Cell = getCellRenderer(resolveCellRendererType(def as { type?: string; format?: string }));
  const { container, unmount } = render(<Cell value={value} field={def as never} />);
  const text = (container.textContent ?? '').trim();
  unmount();
  return text;
}

const duplicateKeyWarnings = () => errors.filter((e) => /same key/i.test(e));

describe('Approvals drawer summary — field metadata faces (objectui#11677)', () => {
  it('Invoice Dual Sign-off: option labels and the date face, under the declared labels', async () => {
    useRequest(INVOICE);
    const dialog = await openedDrawer(INVOICE);
    // Settlement: the option LABEL can only appear once the schema answered.
    await waitFor(() => expect(summaryRows(dialog).get('region')?.value).toBe('EMEA'));
    const rows = summaryRows(dialog);

    expect(rows.get('region')).toEqual({ label: 'Region', value: recordPageFace('showcase_invoice', 'region', 'emea') });
    expect(rows.get('status')).toEqual({ label: 'Status', value: 'Sent' });
    expect(rows.get('status')?.value).toBe(recordPageFace('showcase_invoice', 'status', 'sent'));
    expect(rows.get('issued_on')?.label).toBe('Issued On');
    expect(rows.get('issued_on')?.value).toBe(recordPageFace('showcase_invoice', 'issued_on', '2026-07-23'));
    expect(rows.get('name')).toEqual({ label: 'Invoice Number', value: 'INV-1010' });
    expect(rows.get('owner')).toEqual({ label: 'Owner', value: 'grace@example.com' });

    // The raw stored values are gone from the card.
    for (const raw of ['emea', 'sent', '2026-07-23']) {
      expect(within(dialog).queryByText(raw)).not.toBeInTheDocument();
    }
  });

  it('Invoice Dual Sign-off: one "Owner", and no duplicate-key warning', async () => {
    useRequest(INVOICE);
    const dialog = await openedDrawer(INVOICE);
    await waitFor(() => expect(summaryRows(dialog).get('region')?.value).toBe('EMEA'));
    const labels = [...summaryRows(dialog).values()].map((r) => r.label);

    expect(labels.filter((l) => l === 'Owner')).toHaveLength(1);
    expect(new Set(labels).size).toBe(labels.length);
    // `owner_id` is the platform's injected ownership column — bookkeeping, not
    // a business field of the record — so the card does not spend a row on it.
    expect(summaryRows(dialog).has('owner_id')).toBe(false);
    expect(duplicateKeyWarnings()).toEqual([]);
  });

  it('High-Value Expense — Committee Quorum: "Approved" is the summary face of `approved_amount`', async () => {
    useRequest(EXPENSE);
    const dialog = await openedDrawer(EXPENSE);
    await waitFor(() => expect(summaryRows(dialog).get('status')?.value).toBe('Submitted'));
    const rows = summaryRows(dialog);

    expect(rows.get('approved_amount')).toEqual({
      label: 'Approved',
      value: recordPageFace('showcase_expense_report', 'approved_amount', 0),
    });
    expect(rows.get('status')?.value).toBe(recordPageFace('showcase_expense_report', 'status', 'submitted'));
    expect(rows.get('submitted_on')?.value).toBe(recordPageFace('showcase_expense_report', 'submitted_on', '2026-10-05'));
    expect(within(dialog).queryByText('2026-10-05')).not.toBeInTheDocument();

    const labels = [...rows.values()].map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(duplicateKeyWarnings()).toEqual([]);
  });

  it('keeps the lead amount under its declared label, through the same face', async () => {
    useRequest(EXPENSE);
    const dialog = await openedDrawer(EXPENSE);
    await waitFor(() => expect(summaryRows(dialog).get('status')?.value).toBe('Submitted'));

    const lead = dialog.querySelector('[data-summary-lead]');
    expect(lead?.getAttribute('data-summary-lead')).toBe('total_amount');
    expect(lead?.children[0]?.textContent).toBe('Total');
    expect((lead?.children[1]?.textContent ?? '').trim())
      .toBe(recordPageFace('showcase_expense_report', 'total_amount', 8900));
    // Led once, never again as an ordinary row.
    expect(summaryRows(dialog).has('total_amount')).toBe(false);
  });

  it('labels the lead from the metadata read, as the record page does — not from `payload_labels`', async () => {
    useRequest(INVOICE);
    const dialog = await openedDrawer(INVOICE);
    await waitFor(() => expect(summaryRows(dialog).get('region')?.value).toBe('EMEA'));

    const lead = dialog.querySelector('[data-summary-lead]');
    expect(lead?.getAttribute('data-summary-lead')).toBe('total');
    // The record page reads "Total" for this field; the snapshot's server
    // label ("Subtotal") is what the card showed before.
    expect(lead?.children[0]?.textContent).toBe('Total');
    expect((lead?.children[1]?.textContent ?? '').trim()).toBe(recordPageFace('showcase_invoice', 'total', 0));
  });

  it('a payload key the object does not declare takes no row once the schema answered', async () => {
    const row = {
      ...INVOICE,
      payload: { ...(INVOICE.payload as Record<string, unknown>), legacy_note: 'snapshot-era column' },
    };
    useRequest(row);
    const dialog = await openedDrawer(row);
    await waitFor(() => expect(summaryRows(dialog).get('region')?.value).toBe('EMEA'));

    expect(summaryRows(dialog).has('legacy_note')).toBe(false);
    expect(within(dialog).queryByText('snapshot-era column')).not.toBeInTheDocument();
  });

  it('two DECLARED fields sharing one label are told apart, and keyed apart', async () => {
    const schema = SCHEMAS.showcase_invoice as { fields: Record<string, unknown> };
    getObjectSchema.mockImplementation(async (name: string) => (name === 'showcase_invoice'
      ? { ...schema, fields: { ...schema.fields, region: { ...(schema.fields.region as object), label: 'Status' } } }
      : SCHEMAS[name]));
    useRequest(INVOICE);
    const dialog = await openedDrawer(INVOICE);
    await waitFor(() => expect(summaryRows(dialog).get('region')?.value).toBe('EMEA'));
    const rows = summaryRows(dialog);

    const labels = [...rows.values()].map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(rows.get('region')?.label).not.toBe(rows.get('status')?.label);
    // Both still carry the declared label they share.
    expect(rows.get('region')?.label).toContain('Status');
    expect(rows.get('status')?.label).toContain('Status');
    expect(duplicateKeyWarnings()).toEqual([]);
  });

  it('FAILS OPEN: a source that cannot describe the object renders the snapshot as before, still one label per row', async () => {
    getObjectSchema.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
    useRequest(INVOICE);
    const dialog = await openedDrawer(INVOICE);
    await waitFor(() => expect(getObjectSchema).toHaveBeenCalledWith('showcase_invoice'));
    await waitFor(() => expect(summaryRows(dialog).get('region')?.value).toBe('emea'));
    const rows = summaryRows(dialog);

    // Unknown metadata: the server's labels and the stored text, as today.
    expect(rows.get('region')).toEqual({ label: 'Region', value: 'emea' });
    expect(rows.get('owner')).toEqual({ label: 'Owner', value: 'grace@example.com' });
    const labels = [...rows.values()].map((r) => r.label);
    expect(labels.filter((l) => l === 'Owner')).toHaveLength(1);
    expect(new Set(labels).size).toBe(labels.length);
    expect(duplicateKeyWarnings()).toEqual([]);
  });
});
