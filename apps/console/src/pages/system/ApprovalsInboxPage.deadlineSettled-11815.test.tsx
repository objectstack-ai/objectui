// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Approvals drawer — a declared deadline in the record summary card is judged
 * against the snapshot the card draws (objectui#11815, ruling D).
 *
 * `RecordFieldFace` draws a snapshot value through the record page's own
 * cell. The date cell paints a declared deadline (`dueLike: true`) from the
 * declaration alone and cannot evaluate `settledWhen`, so the face hands it
 * `deadlineSettled`, judged by `isDeadlineSettled` against the request's
 * `payload` — the same snapshot the face reads its value from. The snapshot's
 * date and its status were frozen together at submission, so a done
 * snapshot's past deadline reads neutral and an open one's reads overdue.
 *
 * Harness: `ApprovalsInboxPage.summaryFaces-11677.test.tsx`'s, reduced to one
 * object (`setup.access` keeps the raw-JSON panel away for the same reason).
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MePermissionsProvider, type MePermissionsResponse } from '@object-ui/permissions';

const APP = 'com.example.showcase';

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const { approvalsApiStub, getObjectSchema, ADAPTER, AUTH, I18N, SCHEMA } = vi.hoisted(() => {
  const SCHEMA = {
    name: 'showcase_task',
    label: 'Task',
    fields: {
      name: { type: 'text', label: 'Title' },
      status: {
        type: 'select', label: 'Status',
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Done', value: 'done' },
        ],
      },
      due_date: { type: 'date', label: 'Due', dueLike: true, settledWhen: "record.status == 'done'" },
      // CONTROL: a past date with no declaration is never a deadline.
      reviewed_on: { type: 'date', label: 'Reviewed On' },
    },
  };
  const getObjectSchema = vi.fn(async (name: string): Promise<unknown> => (name === SCHEMA.name ? SCHEMA : { fields: {} }));
  const approvalsApiStub = {
    listRequests: vi.fn(async (): Promise<{ data: unknown[]; total: number }> => ({ data: [], total: 0 })),
    getRequest: vi.fn(async (): Promise<{ data: unknown }> => ({ data: null })),
    listActions: vi.fn(async () => ({ data: [] })),
    approve: vi.fn(),
    reject: vi.fn(),
  };
  // STABLE singletons, as in the summaryFaces harness.
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

function requestFor(status: string): Record<string, unknown> {
  const payload = { name: `Task ${status}`, status, due_date: daysAgo(5), reviewed_on: daysAgo(5) };
  return {
    id: `req_${status}`,
    status: 'pending',
    pending_approvers: ['u_1'],
    submitter_id: 'u_9',
    submitter_name: 'Dev Admin',
    submitted_at: '2026-10-06T05:00:00.000Z',
    process_name: 'task_signoff',
    process_label: `Task Sign-off (${status})`,
    object_name: SCHEMA.name,
    object_label: 'Task',
    record_id: `t_${status}`,
    record_title: `Task ${status}`,
    payload,
    payload_labels: {},
    payload_display: {},
  };
}

beforeEach(() => {
  getObjectSchema.mockClear();
  for (const fn of Object.values(approvalsApiStub)) fn.mockClear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function openedDrawer(row: Record<string, unknown>): Promise<HTMLElement> {
  approvalsApiStub.listRequests.mockResolvedValue({ data: [row], total: 1 });
  approvalsApiStub.getRequest.mockResolvedValue({ data: row });
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

/** The summary row's value cell for one field key. */
function valueCell(dialog: HTMLElement, key: string): HTMLElement | null {
  const row = dialog.querySelector(`[data-summary-field="${key}"]`);
  return (row?.children[1] as HTMLElement | undefined) ?? null;
}

const isRed = (el: HTMLElement | null) => !!el?.querySelector('.text-red-600');

describe('Approvals drawer summary — a declared deadline is judged against the snapshot (objectui#11815)', () => {
  it("a snapshot whose `settledWhen` holds draws its past deadline neutral", async () => {
    const dialog = await openedDrawer(requestFor('done'));
    await waitFor(() => expect(valueCell(dialog, 'due_date')?.textContent).toBe('5 days ago'));
    expect(isRed(valueCell(dialog, 'due_date'))).toBe(false);
  });

  it("a snapshot whose `settledWhen` does not hold draws its past deadline overdue", async () => {
    const dialog = await openedDrawer(requestFor('open'));
    await waitFor(() => expect(valueCell(dialog, 'due_date')?.textContent).toBe('Overdue 5d'));
    expect(isRed(valueCell(dialog, 'due_date'))).toBe(true);
  });

  it('CONTROL: an undeclared past date on the open snapshot is never overdue', async () => {
    const dialog = await openedDrawer(requestFor('open'));
    await waitFor(() => expect(valueCell(dialog, 'reviewed_on')).not.toBeNull());
    expect(valueCell(dialog, 'reviewed_on')?.textContent).not.toMatch(/Overdue/);
    expect(isRed(valueCell(dialog, 'reviewed_on'))).toBe(false);
  });
});
