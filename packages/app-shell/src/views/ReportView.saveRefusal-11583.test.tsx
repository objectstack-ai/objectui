// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11583: the report editor's Save says a refused save.
 *
 * ## The defect this pins
 *
 * `ReportView.saveSchema` caught a refused `persistRuntimeMetadata('report', …)`
 * with `console.warn('[ReportView] Auto-save failed:', err)` only, so a refused
 * report edit looked saved.
 *
 * ## The cadence, measured here rather than assumed
 *
 * The card asked whether this save fires per edit. It does not: an inspector
 * edit reaches `handleReportFieldChange`, which updates the live preview only,
 * and the write fires once per press of the panel's Save. So one refusal is
 * one toast, and nothing here needs a burst guard. The first case counts the
 * writes after three edits (none) and after Save (one), so a change that made
 * the editor save per edit would fail here, before it could stack toasts.
 *
 * ## What runs
 *
 * The real `ReportView`, the real `ReportConfigPanel` and the real persistence
 * seam, over a metadata client double whose `save` rejects the way
 * `MetadataClient` does. The panel's spec inspector is reduced to one edit
 * button, and the draft bar (its own reads) to nothing.
 *
 * Direction, written before the run: on the unmodified tree the refused case
 * goes RED (no `toast.error`), and the control stays GREEN.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, cleanup } from '@testing-library/react';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(), error: vi.fn(), info: vi.fn(),
    warning: vi.fn(), loading: vi.fn(), dismiss: vi.fn(),
  }),
}));

vi.mock('@object-ui/plugin-report', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ReportRenderer: () => null,
}));
vi.mock('@object-ui/plugin-dashboard', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  DrillDownDrawer: () => null,
}));
// The panel's spec inspector, reduced to one edit: a new title.
vi.mock('./metadata-admin/inspectors/ReportDefaultInspector', () => ({
  ReportDefaultInspector: ({ onPatch }: any) => (
    <button type="button" data-testid="stub-report-edit" onClick={() => onPatch({ label: 'Revenue EDITED' })}>
      edit
    </button>
  ),
}));
vi.mock('./RuntimeDraftBar', () => ({ RuntimeDraftBar: () => null }));

const meta = vi.hoisted(() => ({ value: null as any }));
vi.mock('../providers/MetadataProvider', () => ({ useMetadata: () => meta.value }));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ reportName: 'revenue_by_month' }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/reports/revenue_by_month', search: '' }),
}));

vi.mock('./useOpenRecordList', () => ({ useOpenRecordList: () => vi.fn() }));
vi.mock('./MetadataInspector', () => ({
  MetadataPanel: () => null,
  useMetadataInspector: () => ({ showDebug: false }),
}));
const client = vi.hoisted(() => ({ value: null as any }));
vi.mock('./metadata-admin/useMetadata', () => ({ useMetadataClient: () => client.value }));
vi.mock('../providers/AdapterProvider', () => ({ useAdapter: () => ({}) }));
vi.mock('../providers/ExpressionProvider', () => ({ useExpressionContext: () => ({ app: undefined }) }));
vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  // The report editor is admin-only.
  useWorkspaceAdminStatus: () => ({ isAdmin: true, isResolved: true }),
}));

import { ReportView } from './ReportView';

const refresh = vi.fn(async () => {});

function mountReport() {
  meta.value = {
    apps: [],
    objects: [{ name: 'acct', label: 'Account', fields: { industry: { label: 'Industry', type: 'text' } } }],
    dashboards: [],
    reports: [{ name: 'revenue_by_month', label: 'Revenue by Month', dataSource: { object: 'acct' } }],
    pages: [],
    loading: false,
    error: null,
    refresh,
    invalidate: () => {},
    ensureType: async () => [],
    getItem: vi.fn(async () => null),
    getItemsByType: () => [],
    getTypeStatus: () => 'ready',
  };
  render(<ReportView dataSource={{ find: vi.fn(async () => ({ data: [] })) } as any} />);
}

/** Open the editor, make three edits, and press Save. */
async function editThriceAndSave() {
  fireEvent.click(await screen.findByTestId('report-edit-button'));
  await screen.findByTestId('report-config-panel');
  for (let i = 0; i < 3; i++) fireEvent.click(screen.getByTestId('stub-report-edit'));
  // Edits drive the live preview only: nothing is written yet.
  expect(client.value.save).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.click(screen.getByTestId('report-config-save'));
  });
  await waitFor(() => expect(client.value.save).toHaveBeenCalledTimes(1));
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('the report editor\'s Save says a refused save (objectui#11583, ReportView.saveSchema)', () => {
  it('a refused save raises the refusal, once per Save', async () => {
    client.value = {
      get: vi.fn(async () => null),
      save: vi.fn(async () => {
        throw Object.assign(new Error('Saving reports requires the Manage Metadata permission'), { status: 403 });
      }),
    };
    mountReport();
    await editThriceAndSave();

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    const [, options] = vi.mocked(toast.error).mock.calls[0] as [unknown, { description?: unknown } | undefined];
    expect(String(options?.description)).toContain('Saving reports requires the Manage Metadata permission');
    const [type, name, body, opts] = client.value.save.mock.calls[0];
    expect([type, name, opts]).toEqual(['report', 'revenue_by_month', { mode: 'draft' }]);
    expect(body).toMatchObject({ label: 'Revenue EDITED' });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('a save that lands raises nothing and refreshes the read (control)', async () => {
    client.value = { get: vi.fn(async () => null), save: vi.fn(async () => ({})) };
    mountReport();
    await editThriceAndSave();

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalled();
  });
});
