/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10035 — a write refreshes the list's DATA; it does not rebuild the
 * list (AGENTS.md #8's corollary).
 *
 * ## The defect this pins
 *
 * `renderListView` keyed `<ListView>` on `objectName-viewId-counter`, where the
 * counter is this page's refresh signal plus the plugin ObjectView's. The page
 * bumps it after every write it hears about — record actions, import, realtime
 * events, view edits, and the console's `externalRefreshKey` (record-form save,
 * undo, redo). So each write REMOUNTED the list: its toolbar, search, popovers,
 * selection and in-list visualization choice all went with it. The rows were
 * refetched too — a remounted `ListView` fetches on mount — which is why
 * nothing looked broken: the damage was the remount, not a missing refetch.
 *
 * ## The two halves, and which world each one can fail in
 *
 * The in-place cases assert BOTH:
 *   (a) the list is the SAME mounted tree after the write — a DOM node read
 *       inside `ListView` before the write is the node on the page after it
 *       (a key remount replaces every node), and
 *   (b) the list query was re-issued, exactly once.
 * Against the pre-fix source (a) is the red half; (b) stays green there,
 * because that world refetched as well — through the remount. (b) is the half
 * that goes red if the counter leaves the key without reaching `ListView`
 * another way (`refreshTrigger`), which is the regression a naive "remove the
 * key" fix would ship: the page's own counter used to reach the list through
 * the key alone.
 *
 * ## The remount that stays, pinned as the refresh it still is
 *
 * A list that can draw `gantt` or `chart` — as its own type, or through the
 * author's visualization whitelist — keeps the counter in its key, because
 * those renderers fetch for themselves and read nothing that moves on a write
 * (`REMOUNT_TO_REFRESH_VISUALIZATIONS`). Those cases assert the fresh tree.
 *
 * Everything here renders for real — the page, `plugin-view`'s `ObjectView`
 * and `plugin-list`'s `ListView` — on the harness of
 * `ObjectView.hostRerenderRefetch-10046.test.tsx`.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@object-ui/permissions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@object-ui/permissions')>();
  // STABLE identities: `ListView` names `perms` in its fetch dependency list,
  // so a fresh object per call would loop the fetch on its own.
  const perms = {
    check: () => ({ allowed: true }),
    checkField: () => true,
    getFieldPermissions: () => [],
    getRowFilter: () => undefined,
    getObjectApiOperations: () => undefined,
    roles: [],
    isLoaded: false,
    hasCapabilities: () => true,
    can: () => true,
    cannot: () => false,
  };
  const fieldPerms = { canRead: () => true, canWrite: () => true, permissions: [] };
  return { ...actual, usePermissions: () => perms, useFieldPermissions: () => fieldPerms };
});

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ user: { id: 'u1', name: 'Ada' }, activeOrganization: null }),
  useWorkspaceAdminStatus: () => ({ isAdmin: false, isResolved: true }),
  createAuthenticatedFetch: () => vi.fn(),
}));

vi.mock('@object-ui/collaboration', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRealtimeSubscription: () => ({ lastMessage: null }),
  useConflictResolution: () => ({ hasConflicts: false, resolveAllConflicts: () => {} }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(), error: vi.fn(), info: vi.fn(),
    warning: vi.fn(), loading: vi.fn(), dismiss: vi.fn(),
  }),
}));

vi.mock('./MetadataInspector', () => ({
  MetadataPanel: () => null,
  useMetadataInspector: () => ({ showDebug: false, toggle: () => {} }),
}));
vi.mock('./RecordDetailView', () => ({ RecordDetailView: () => null }));

import { ObjectView } from './ObjectView';
import { ExpressionProvider } from '../providers/ExpressionProvider';

const OBJECT_NAME = 'duly_task';

/**
 * The view under test is always `all`. Its `description` renders as
 * `view-description` INSIDE `ListView`, which is the node whose identity (a)
 * reads.
 */
function objectsWith(allView: Record<string, unknown>) {
  return [
    {
      name: OBJECT_NAME,
      label: 'Task',
      fields: {
        id: { type: 'text', label: 'Id' },
        name: { type: 'text', label: 'Name' },
        stage: { type: 'select', label: 'Stage', options: [{ label: 'A', value: 'a' }] },
        starts_on: { type: 'date', label: 'Starts' },
        ends_on: { type: 'date', label: 'Ends' },
      },
      listViews: {
        all: { label: 'All', columns: ['name', 'stage'], description: 'Every task', ...allView },
      },
    },
  ];
}

/** The list queries `ListView` issued; the page's `$top: 0` count probe is excluded. */
let listQueries = 0;
function makeDataSource() {
  return {
    find: vi.fn(async (_object: string, params: any) => {
      if (params?.$top !== 0) listQueries++;
      return { data: [], total: 0 };
    }),
    findOne: vi.fn(async () => null),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
  } as any;
}

/** A window long enough for every effect a step schedules to have fired. */
const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 400)));

/**
 * Mounts the page and returns the console's write signal: `externalRefreshKey`
 * is what `AppContent` bumps after a record-form save, an undo and a redo.
 */
async function mountPage(allView: Record<string, unknown>): Promise<{ write: () => Promise<void> }> {
  const dataSource = makeDataSource();
  const objects = objectsWith(allView);
  let bump: () => void = () => {};
  function Harness() {
    const [externalRefreshKey, setExternalRefreshKey] = React.useState(0);
    bump = () => setExternalRefreshKey((n) => n + 1);
    return (
      <ExpressionProvider user={{ id: 'u1', name: 'Ada', profile: 'admin' }}>
        <MemoryRouter initialEntries={[`/apps/demo/${OBJECT_NAME}/view/all`]}>
          <Routes>
            <Route
              path="/apps/:appName/:objectName/view/:viewId"
              element={
                <ObjectView
                  dataSource={dataSource}
                  objects={objects}
                  onEdit={() => {}}
                  externalRefreshKey={externalRefreshKey}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ExpressionProvider>
    );
  }
  render(<Harness />);
  await settle();
  return {
    write: async () => {
      await act(async () => bump());
      await settle();
    },
  };
}

/** A node rendered inside `ListView` — replaced wholesale by a key remount. */
const listNode = () => screen.getByTestId('view-description');

beforeEach(() => {
  cleanup();
  listQueries = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('the object page refreshes its list in place after a write (objectui#10035)', () => {
  it.each([
    ['grid', { type: 'grid' }],
    ['kanban', { type: 'kanban', kanban: { groupByField: 'stage' } }],
  ])('%s: the same list re-issues its query once', async (_label, allView) => {
    const page = await mountPage(allView);
    const node = listNode();
    const before = listQueries;

    await page.write();

    expect(
      listQueries - before,
      '(b) The list did not re-query after the write, or re-queried more than once.\n'
        + 'This page\'s refresh counter must reach `ListView` as `refreshTrigger` (the\n'
        + 'input its fetch effect names) once it no longer rides in the key.',
    ).toBe(1);
    expect(
      listNode(),
      '(a) The write REMOUNTED the list: the node read inside `ListView` before the\n'
        + 'write is gone. The refresh counter is back in the `<ListView>` key, so every\n'
        + 'save throws the list\'s UI state away (AGENTS.md #8: refresh data, don\'t\n'
        + 'rebuild UI). Only lists that can draw a `REMOUNT_TO_REFRESH_VISUALIZATIONS`\n'
        + 'member may keep it.',
    ).toBe(node);
  });
});

describe('a list that can draw a view with no in-place refetch path still shows a write — by remount (objectui#10035)', () => {
  it.each([
    ['its own type is gantt', { type: 'gantt', gantt: { startDateField: 'starts_on', endDateField: 'ends_on' } }],
    [
      'gantt is in its visualization whitelist',
      { type: 'grid', gantt: { startDateField: 'starts_on', endDateField: 'ends_on' }, appearance: { allowedVisualizations: ['grid', 'gantt'] } },
    ],
  ])('%s: a write mounts a fresh list', async (_label, allView) => {
    const page = await mountPage(allView);
    const node = listNode();

    await page.write();

    expect(
      listNode(),
      'The list was NOT remounted after a write although it can draw a gantt or chart.\n'
        + 'Those renderers fetch for themselves and read no refresh input, so without the\n'
        + 'remount they silently keep showing the pre-write rows. Remove a member from\n'
        + '`REMOUNT_TO_REFRESH_VISUALIZATIONS` only together with a change that makes its\n'
        + 'renderer refetch in place.',
    ).not.toBe(node);
  });
});
