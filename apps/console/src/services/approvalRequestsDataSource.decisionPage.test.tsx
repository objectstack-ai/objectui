/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * objectui#12045 (B1 of objectui#2763) — an approval request's record page,
 * on the REAL `RecordDetailView`, read through the routed approvals source,
 * with a slotted page that places `record:approval_decision`.
 *
 * The page fixture is the shape objectstack-ai/objectstack#22473 proposes for
 * plugin-approvals: a `kind: 'slotted'` record page for `sys_approval_request`
 * whose `actions` slot holds the decision panel and whose discussion is empty.
 *
 * The panel is module-internal this round (claim amendment 3 on objectui#12045,
 * `6081385696`): nothing in source registers it, because a registered type
 * needs a zod arm derived from the v18 spec row (objectstack-ai/objectstack#22472).
 * So this file registers the shipped renderer itself, under the proposed name,
 * before anything renders, as the page-mount step's registration will.
 * Everything else on it is synthesized from the object, as on a served page.
 * Only the HTTP transport and the console adapter are doubled, so what the page
 * reads, and from where, is what the shipped code sends:
 *
 *   - the request from `GET /approvals/requests/:id` (with `viewer` and
 *     `decision_progress`, which the data API does not attach);
 *   - its timeline from `GET /approvals/requests/:id/actions`;
 *   - the target record of the `record_id` pointer pair from the adapter, drawn
 *     as A2's card;
 *   - the decision as the declared action's POST, through `ActionParamDialog`.
 *
 * The last describe block mounts the console's own route for this object
 * beside the generic record route, as `AppContent` hands both to the shell, and
 * pins that the request's record page is the routed one.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ user: { id: 'u1', name: 'Ada', image: null }, activeOrganization: null }),
}));
vi.mock('@object-ui/collaboration', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRecordPresence: () => [],
  PresenceAvatars: () => null,
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(), error: vi.fn(), info: vi.fn(),
    warning: vi.fn(), loading: vi.fn(), dismiss: vi.fn(),
  }),
}));

import { AdapterCtx, MetadataCtx } from '@object-ui/react';
import { I18nProvider, type I18nConfig } from '@object-ui/i18n';
import { RecordDetailView } from '@object-ui/app-shell';
import type { DataSource } from '@object-ui/types';
import {
  APPROVAL_ACTION_OBJECT,
  APPROVAL_REQUEST_OBJECT,
  createApprovalRequestsDataSource,
} from './approvalRequestsDataSource';
import { approvalRequestRoutes } from '../AppContent';
import { PageSchema } from '@objectstack/spec/ui';
import { ComponentRegistry } from '@object-ui/core';

// The shipped renderer, from its module (the package entry does not export it),
// registered here under the proposed type name; see the header.
const { ApprovalDecisionRenderer } = await vi.importActual<{
  ApprovalDecisionRenderer: Parameters<typeof ComponentRegistry.register>[1];
}>('../../../../packages/app-shell/src/views/approval-decision/ApprovalDecisionPanel');
ComponentRegistry.register('approval_decision', ApprovalDecisionRenderer, { namespace: 'record', skipFallback: true });

const REQ = 'req_12045';
const VIEWER = { can_act: true, is_submitter: false, can_override: false };
const ROW = {
  id: REQ,
  process_name: 'invoice_approval',
  object_name: 'invoice',
  record_id: 'inv_1',
  status: 'pending',
  pending_approvers: ['u1', 'u2', 'u3'],
  viewer: VIEWER,
  decision_progress: { behavior: 'quorum', got: 1, need: 2 },
};
const TIMELINE = [
  { id: 'act_1', request_id: REQ, action: 'submit', comment: 'Please review the laptop order', created_at: '2026-10-01T09:00:00Z' },
  { id: 'act_2', request_id: REQ, action: 'approve', comment: 'Budget checked', created_at: '2026-10-02T09:00:00Z' },
];

/** The request's declared decisions, in the wire shape (CEL envelopes). */
const DECIDE = { dialect: 'cel', source: 'record.viewer.can_act || record.viewer.can_override' };
const DECISION_PARAMS = [
  { name: 'comment', label: 'Comment', type: 'textarea', required: false },
  { name: 'attachments', label: 'Attachments', type: 'file', multiple: true, required: false },
];
const REQUEST_DEF = {
  name: APPROVAL_REQUEST_OBJECT,
  label: 'Approval Request',
  nameField: 'process_name',
  fields: {
    id: { label: 'Id', type: 'text' },
    process_name: { label: 'Process', type: 'text' },
    object_name: { label: 'Object', type: 'text' },
    record_id: { label: 'Record', type: 'text', referenceVia: 'object_name' },
    status: { label: 'Status', type: 'text' },
    submitter_id: { label: 'Submitter', type: 'lookup', reference: 'sys_user' },
  },
  actions: [
    {
      name: 'approval_approve', label: 'Approve', type: 'api', method: 'POST',
      target: '/api/v1/approvals/requests/{id}/approve', params: DECISION_PARAMS,
      visible: DECIDE, locations: ['record_section', 'list_item'], refreshAfter: true,
    },
    {
      name: 'approval_reject', label: 'Reject', type: 'api', method: 'POST',
      target: '/api/v1/approvals/requests/{id}/reject', params: DECISION_PARAMS,
      visible: DECIDE, locations: ['record_section', 'list_item'], refreshAfter: true,
    },
  ],
};
const ACTION_DEF = {
  name: APPROVAL_ACTION_OBJECT,
  label: 'Approval Action',
  pluralLabel: 'Approval Actions',
  fields: {
    id: { label: 'Action ID', type: 'text' },
    request_id: { label: 'Request', type: 'lookup', reference: APPROVAL_REQUEST_OBJECT },
    action: { label: 'Action', type: 'text' },
    comment: { label: 'Comment', type: 'text' },
    created_at: { label: 'Created', type: 'datetime' },
  },
};
const INVOICE_DEF = {
  name: 'invoice',
  label: 'Invoice',
  nameField: 'subject',
  highlightFields: ['amount'],
  fields: { subject: { label: 'Subject', type: 'text' }, amount: { label: 'Amount', type: 'number' } },
};
const DEFS: Record<string, unknown> = {
  [APPROVAL_REQUEST_OBJECT]: REQUEST_DEF,
  [APPROVAL_ACTION_OBJECT]: ACTION_DEF,
  invoice: INVOICE_DEF,
};

/**
 * The slotted page (objectstack-ai/objectstack#22473's shape). Its `highlights`
 * slot is empty and its `details` slot authors the Details tab's body. Both are
 * needed for the pointer card: the details grid hides every field a mounted
 * highlights strip shows (the synthesized Details tab is also handed the
 * object's `highlightFields` as `hideFields`), and the real object declares
 * `record_id` among its `highlightFields`. Left in the strip, the pair is drawn
 * by `record:highlights`, which is not a pointer call site.
 */
const REQUEST_PAGE = {
  name: 'sys_approval_request_detail',
  label: 'Approval Request',
  type: 'record',
  object: APPROVAL_REQUEST_OBJECT,
  kind: 'slotted',
  slots: {
    actions: [{ type: 'record:approval_decision' }],
    highlights: [],
    details: [
      {
        type: 'record:details',
        properties: { sections: [{ label: 'Request', fields: ['process_name', 'object_name', 'record_id', 'status'] }] },
      },
    ],
    discussion: [],
  },
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

/** Every request the page sent over HTTP: method, path and query, body. */
let wire: Array<{ method: string; path: string; body?: unknown }> = [];

/** The approvals routes, answered as objectstack's REST server answers them. */
const transport = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(raw, 'http://test.local');
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
  wire.push({ method, path: url.pathname + url.search, body });
  if (method === 'GET' && url.pathname === `/api/v1/approvals/requests/${REQ}`) return json(200, ROW);
  if (method === 'GET' && url.pathname === `/api/v1/approvals/requests/${REQ}/actions`) return json(200, { data: TIMELINE });
  if (method === 'POST' && url.pathname === `/api/v1/approvals/requests/${REQ}/approve`) {
    return json(200, { request: ROW, finalized: false });
  }
  return json(200, { success: true, data: [] });
});
vi.stubGlobal('fetch', transport);

/** The console adapter, doubled: side reads and the pointer's target land here. */
const host = {
  find: vi.fn(async (_resource: string, _params?: unknown) => ({ data: [], total: 0 })),
  findOne: vi.fn(async (resource: string, id: string) =>
    resource === 'invoice' && id === 'inv_1' ? { id: 'inv_1', subject: 'Laptop refresh', amount: 4200 } : null),
  create: vi.fn(), update: vi.fn(), delete: vi.fn(),
  getObjectSchema: vi.fn(async (name: string) => DEFS[name] ?? null),
};

const metadata = {
  apps: [], objects: [REQUEST_DEF, ACTION_DEF, INVOICE_DEF], dashboards: [], reports: [],
  pages: [REQUEST_PAGE], loading: false, error: null,
  refresh: async () => {}, invalidate: () => {}, ensureType: async () => [],
  getItem: async (type: string, name: string) => (type === 'object' ? (DEFS[name] ?? null) : null),
  getItemsByType: () => [],
  getTypeStatus: () => 'ready' as const,
};

const EN: I18nConfig = { defaultLanguage: 'en', detectBrowserLanguage: false };

function openRequestPage() {
  const ds = createApprovalRequestsDataSource({
    host: host as unknown as DataSource,
    scope: { kind: 'all' },
    fetch: transport,
    baseUrl: 'http://test.local/api/v1',
  });
  return render(
    <I18nProvider config={EN} persistLanguage={false}>
      <MemoryRouter initialEntries={[`/apps/demo/${APPROVAL_REQUEST_OBJECT}/record/${REQ}`]}>
        <MetadataCtx.Provider value={metadata as never}>
          <AdapterCtx.Provider value={host as never}>
            <RecordDetailView
              dataSource={ds as never}
              objects={metadata.objects as never}
              onEdit={() => {}}
              objectNameOverride={APPROVAL_REQUEST_OBJECT}
              recordIdOverride={REQ}
            />
          </AdapterCtx.Provider>
        </MetadataCtx.Provider>
      </MemoryRouter>
    </I18nProvider>,
  );
}

const requestGets = () => wire.filter((w) => w.method === 'GET' && w.path === `/api/v1/approvals/requests/${REQ}`);

afterEach(() => {
  cleanup();
  wire = [];
  host.find.mockClear();
  host.findOne.mockClear();
});

describe("an approval request's record page with record:approval_decision (objectui#12045)", () => {
  it('the page fixture parses as a spec page', () => {
    const parsed = PageSchema.safeParse(REQUEST_PAGE);
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [])).toBe(true);
  });

  it("the decision panel draws the request's tally and its declared decisions, gated by the served viewer block", async () => {
    openRequestPage();
    const panel = await screen.findByTestId('approval-decision-panel', undefined, { timeout: 8000 });
    const bar = await within(panel).findByRole('progressbar', undefined, { timeout: 8000 });
    expect(bar.getAttribute('aria-valuenow')).toBe('1');
    expect(bar.getAttribute('aria-valuemax')).toBe('2');
    expect(await within(panel).findByTestId('declared-action-approval_approve', undefined, { timeout: 8000 })).toBeTruthy();
    expect(within(panel).getByTestId('declared-action-approval_reject')).toBeTruthy();
    // The request came from the approvals get route, the one door that serves `viewer`.
    expect(requestGets().length).toBeGreaterThan(0);
  });

  it('Approve collects a comment and several files in ActionParamDialog, POSTs the request route, then re-reads the request in place', async () => {
    openRequestPage();
    const approve = await screen.findByTestId('declared-action-approval_approve', undefined, { timeout: 8000 });
    const before = requestGets().length;
    fireEvent.click(approve);

    const dialog = await screen.findByRole('dialog', undefined, { timeout: 8000 });
    // The param widgets are lazy chunks; wait for both to replace their skeletons.
    const comment = await within(dialog).findByRole('textbox', undefined, { timeout: 8000 });
    await waitFor(() => expect(dialog.querySelector('input[type="file"]')).not.toBeNull(), { timeout: 8000 });
    const files = dialog.querySelector('input[type="file"]') as HTMLInputElement;
    expect(files.multiple, 'the attachments param is a multi-file upload control').toBe(true);
    fireEvent.change(comment, { target: { value: 'Looks right' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm/ }));

    await waitFor(
      () => expect(wire.some((w) => w.method === 'POST' && w.path === `/api/v1/approvals/requests/${REQ}/approve`)).toBe(true),
      { timeout: 8000 },
    );
    const post = wire.find((w) => w.method === 'POST' && w.path === `/api/v1/approvals/requests/${REQ}/approve`);
    expect(post?.body).toMatchObject({ comment: 'Looks right' });
    await waitFor(() => expect(requestGets().length).toBeGreaterThan(before), { timeout: 8000 });
  });

  it("record_id, a referenceVia pair, draws the target invoice as A2's card", async () => {
    const { container } = openRequestPage();
    await waitFor(
      () => expect(container.querySelector('[data-record-preview="readable"]')).not.toBeNull(),
      { timeout: 8000 },
    );
    expect(host.findOne).toHaveBeenCalledWith('invoice', 'inv_1');
    expect(container.querySelector('[data-record-preview="readable"]')?.textContent).toContain('Laptop refresh');
  });

  it('the timeline reads the actions route, and no approvals are read ON the request itself', async () => {
    openRequestPage();
    const related = await screen.findByRole('tab', { name: /Related/ }, { timeout: 8000 });
    fireEvent.mouseDown(related);
    fireEvent.click(related);
    expect(await screen.findByText('Budget checked', undefined, { timeout: 8000 })).toBeTruthy();
    expect(wire.some((w) => w.path === `/api/v1/approvals/requests/${REQ}/actions`)).toBe(true);
    expect(host.find.mock.calls.some(([resource]) => resource === APPROVAL_ACTION_OBJECT)).toBe(false);
    // `useRecordApprovals` is skipped on the request's own page.
    expect(wire.some((w) => w.path.startsWith(`/api/v1/approvals/requests?object=${APPROVAL_REQUEST_OBJECT}`))).toBe(false);
  });
});

describe("the console's route for this object (objectui#12045)", () => {
  it('wins over the generic record route and reads the request through the approvals get', async () => {
    render(
      <I18nProvider config={EN} persistLanguage={false}>
        <MemoryRouter initialEntries={[`/${APPROVAL_REQUEST_OBJECT}/record/${REQ}`]}>
          <MetadataCtx.Provider value={metadata as never}>
            <AdapterCtx.Provider value={host as never}>
              <Routes>
                <Route path=":objectName/record/:recordId" element={<div data-testid="generic-record-route" />} />
                {approvalRequestRoutes}
              </Routes>
            </AdapterCtx.Provider>
          </MetadataCtx.Provider>
        </MemoryRouter>
      </I18nProvider>,
    );
    expect(await screen.findByTestId('approval-decision-panel', undefined, { timeout: 8000 })).toBeTruthy();
    expect(screen.queryByTestId('generic-record-route')).toBeNull();
    expect(requestGets().length).toBeGreaterThan(0);
    expect(host.findOne.mock.calls.some(([resource]) => resource === APPROVAL_REQUEST_OBJECT)).toBe(false);
  });

  it('control: another object still takes the generic record route', async () => {
    render(
      <MemoryRouter initialEntries={['/invoice/record/inv_1']}>
        <Routes>
          <Route path=":objectName/record/:recordId" element={<div data-testid="generic-record-route" />} />
          {approvalRequestRoutes}
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('generic-record-route')).toBeTruthy();
  });
});
