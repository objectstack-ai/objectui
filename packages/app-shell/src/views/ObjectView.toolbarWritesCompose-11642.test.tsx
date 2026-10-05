/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11642 — two toolbar changes to one view in one session both survive
 * a reload, on every row kind: an envelope row, a flat row and an overlay.
 *
 * ## The defect this pins
 *
 * `persistViewPatch` sends a whole-document PUT (`updateViewConfig` →
 * `client.meta.saveItem`). It built every body from the active tab as it was
 * when the page loaded — or, for an overlay, from the pending patch alone — and
 * nothing moved that base after a write landed. So the second change was built
 * from a row that no longer existed and dropped the first. Measured live on
 * objectstack `main` (showcase): density, then a header sort, then a reload
 * showed the sort and the OLD density, on all three row kinds.
 *
 * Triage's ruling: after a successful write, the base for the next write is the
 * row that write stored, on every row kind; no client-side merge of guessed
 * fields. The PUT answer carries no row (measured: `{ success, version, seq,
 * state, message }`), and the door drops undeclared keys, so the row is READ
 * BACK — through `loadViewOverrides`, the reader a reload uses — when each write
 * runs.
 *
 * ## What runs
 *
 * The real object page and the real `persistViewPatch` (its 300 ms debounce
 * included), over the real `ObjectStackAdapter`, whose metadata client is a
 * store that judges every PUT with the spec's own `ViewMetadataSchema`, keeps
 * the parsed value (so it drops what the door drops), and answers the PUT the
 * way the door was measured to answer it: with no row. `ListView` is stubbed to
 * capture the schema the page hands it, so a toolbar change is the page's own
 * `onDensityChange` / `onSortChange` callback. A "reload" unmounts the page and
 * mounts it again over a fresh adapter on the same store.
 *
 * ## Direction, written before the reverse-verification run
 *
 * With `persistViewPatch` put back to building the body from the page-load tab
 * (envelope and flat) and from the pending patch alone (overlay), every
 * `two changes … both survive a reload` case is PREDICTED to go red on the
 * FIRST change's key (the density), and the in-flight case red the same way.
 * The single-write coalescing case is predicted to stay green: one debounced
 * write carrying both keys never depended on the base.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { normalizeListViewSchema } from '@object-ui/core';
import { ViewMetadataSchema } from '@objectstack/spec/ui';
import { ObjectStackAdapter } from '@object-ui/data-objectstack';

vi.mock('@object-ui/permissions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@object-ui/permissions')>();
  // Stable identities: `ListView` names `perms` in its fetch dependencies.
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
  useWorkspaceAdminStatus: () => ({ isAdmin: true, isResolved: true }),
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

/** The list schema the object page hands down: captured, not rendered. */
let listSchema: any = null;
vi.mock('@object-ui/plugin-list', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@object-ui/plugin-list')>()),
  ListView: (props: any) => {
    listSchema = props.schema;
    return null;
  },
}));

import { toast } from 'sonner';
import { ObjectView } from './ObjectView';
import { ExpressionProvider } from '../providers/ExpressionProvider';

const OBJECT_NAME = 'track_task';
const ENVELOPE_ID = `${OBJECT_NAME}.in_progress`;
const FLAT_ID = `${OBJECT_NAME}.flat_mine`;
const OVERLAY_ID = `${OBJECT_NAME}.done`;

const FIELDS = {
  id: { type: 'text', label: 'Id' },
  title: { type: 'text', label: 'Title' },
  status: { type: 'text', label: 'Status' },
};

/** A served list view's stored row: the ViewItem envelope. */
const ENVELOPE_ROW = {
  name: ENVELOPE_ID,
  object: OBJECT_NAME,
  viewKind: 'list',
  label: 'In Progress',
  config: {
    type: 'grid',
    data: { provider: 'object', object: OBJECT_NAME },
    columns: ['title', 'status'],
    filter: [{ field: 'status', operator: 'equals', value: 'in_progress' }],
  },
};

/** A saved view whose row is flat — no `config`, no overlay marker. */
const FLAT_ROW = {
  name: FLAT_ID,
  object: OBJECT_NAME,
  viewKind: 'list',
  label: 'Flat Mine',
  type: 'grid',
  columns: ['title', 'status'],
  filter: [{ field: 'status', operator: 'equals', value: 'todo' }],
};

/** The code-defined view an overlay shadows — it has no row of its own. */
const DONE_SOURCE = {
  name: OVERLAY_ID,
  label: 'Done',
  type: 'grid',
  columns: ['title', 'status'],
  filter: [{ field: 'status', operator: 'equals', value: 'done' }],
};

/** A marked overlay on that view, from an earlier session. */
const OVERLAY_ROW = {
  name: OVERLAY_ID,
  object: OBJECT_NAME,
  viewKind: 'list',
  columnState: { widths: { title: 240 } },
  _isOverride: true,
};

/** The object's views as the served object document lists them. */
const DEFINED_VIEWS = {
  [ENVELOPE_ID]: { ...ENVELOPE_ROW.config, name: ENVELOPE_ID, label: ENVELOPE_ROW.label },
  [FLAT_ID]: { ...FLAT_ROW },
  [OVERLAY_ID]: { ...DONE_SOURCE },
};

/** The sort the header click emits — the console's row `id` included, which the door strips. */
const HEADER_SORT = [{ id: 'row-1', field: 'title', order: 'asc' }];
const STORED_SORT = [{ field: 'title', order: 'asc' }];

/**
 * A `sys_metadata`-shaped store: every PUT is judged by the spec's
 * `ViewMetadataSchema` and the PARSED value is kept, and the PUT is answered
 * the way the door answers it — with no row.
 */
function makeStore(seed: Record<string, any>[], opts: { putDelayMs?: (n: number) => number } = {}) {
  const rows = new Map<string, any>();
  for (const row of seed) rows.set(row.name, structuredClone(row));
  let seq = 0;
  const bodies: any[] = [];
  const meta = {
    getItems: vi.fn(async (type: string) => ({
      type,
      items: type === 'view' ? [...rows.values()].map((r) => structuredClone(r)) : [],
    })),
    getItem: vi.fn(async (type: string, name: string) => {
      const item = type === 'view' ? rows.get(name) : undefined;
      if (!item) throw Object.assign(new Error(`Not found: ${type}/${name}`), { status: 404 });
      return { type, name, item: structuredClone(item) };
    }),
    saveItem: vi.fn(async (_type: string, name: string, item: any) => {
      const n = bodies.push(structuredClone(item));
      const delay = opts.putDelayMs?.(n) ?? 0;
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      const judged = ViewMetadataSchema.safeParse(item);
      if (!judged.success) {
        throw Object.assign(new Error(`422 INVALID_METADATA: ${judged.error.message}`), { status: 422 });
      }
      // The parsed value of every key the body carried: an undeclared key is
      // gone, and a schema default the body never named is not invented.
      const kept = Object.fromEntries(
        Object.entries(judged.data as Record<string, unknown>).filter(([key]) => key in item),
      );
      rows.set(name, kept);
      seq += 1;
      return { success: true, version: `hmac-sha256:${'0'.repeat(63)}${seq}`, seq, state: 'active', message: `Saved view '${name}'` };
    }),
  };
  return { meta, rows, bodies };
}

/** The real adapter over the store, and the page's data source over the adapter. */
function pageDataSource(meta: any) {
  const ds: any = new ObjectStackAdapter({
    baseUrl: 'http://test.local',
    fetch: vi.fn(async () =>
      new Response(JSON.stringify({ success: true, data: { capabilities: {}, routes: {} } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })),
  });
  ds.connected = true;
  ds.connectionState = 'connected';
  ds.client = { meta };
  return {
    find: vi.fn(async () => ({ data: [], total: 0 })),
    findOne: vi.fn(async () => null),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
    listViews: (objectName: string, o?: any) => ds.listViews(objectName, o),
    listViewOverrides: (objectName: string) => ds.listViewOverrides(objectName),
    getView: (objectName: string, viewId: string) => ds.getView(objectName, viewId),
    updateViewConfig: vi.fn((objectName: string, viewId: string, config: any, o?: any) =>
      ds.updateViewConfig(objectName, viewId, config, o)),
  } as any;
}

const wait = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));

/** Mount the object page on `viewId` and wait for the page's list schema. */
async function openView(meta: any, viewId: string) {
  listSchema = null;
  const dataSource = pageDataSource(meta);
  render(
    <ExpressionProvider user={{ id: 'u1', name: 'Ada', profile: 'admin' }}>
      <MemoryRouter initialEntries={[`/apps/demo/${OBJECT_NAME}/view/${viewId}`]}>
        <Routes>
          <Route
            path="/apps/:appName/:objectName/view/:viewId"
            element={
              <ObjectView
                dataSource={dataSource}
                objects={[{ name: OBJECT_NAME, label: 'Task', fields: FIELDS, listViews: DEFINED_VIEWS }]}
                onEdit={() => {}}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </ExpressionProvider>,
  );
  await waitFor(() => expect(typeof listSchema?.onDensityChange).toBe('function'));
  // Let the page's own reads (saved views, stored rows) land before a toggle.
  await wait(50);
  return dataSource;
}

/** Unmount, then open the view again over a fresh adapter: what a reload renders. */
async function reload(meta: any, viewId: string) {
  cleanup();
  await openView(meta, viewId);
  await waitFor(() => expect(listSchema?.options).toBeTruthy());
  return {
    rowHeight: (normalizeListViewSchema(listSchema) as { rowHeight?: unknown }).rowHeight,
    sort: listSchema.sort,
  };
}

/** Density, wait past the 300 ms debounce and the round trip, then a header sort. */
async function densityThenSort(gapMs = 600) {
  act(() => listSchema.onDensityChange('comfortable'));
  await wait(gapMs);
  act(() => listSchema.onSortChange(HEADER_SORT));
  await wait(600);
}

beforeEach(() => {
  cleanup();
  listSchema = null;
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: [] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('objectui#11642 — two toolbar changes in one session both survive a reload, on every row kind', () => {
  it('envelope row: the second write carries the first change, inside `config`', async () => {
    const { meta, rows, bodies } = makeStore([ENVELOPE_ROW]);
    const ds = await openView(meta, ENVELOPE_ID);
    await densityThenSort();

    expect(ds.updateViewConfig).toHaveBeenCalledTimes(2);
    expect(toast.error).not.toHaveBeenCalled();
    // The second body was built from the row the first write stored.
    expect(bodies[1].config.rowHeight).toBe('medium');
    expect(bodies[1].config.sort).toEqual(HEADER_SORT);

    const stored = rows.get(ENVELOPE_ID);
    expect(stored.config.rowHeight).toBe('medium');
    expect(stored.config.sort).toEqual(STORED_SORT);
    // The rest of the view is still the view.
    expect(stored.config.filter).toEqual(ENVELOPE_ROW.config.filter);
    expect(stored.config.columns).toEqual(ENVELOPE_ROW.config.columns);
    expect(stored).not.toHaveProperty('_isOverride');

    expect(await reload(meta, ENVELOPE_ID)).toEqual({ rowHeight: 'medium', sort: STORED_SORT });
  });

  it('flat row: the second write carries the first change, flat', async () => {
    const { meta, rows, bodies } = makeStore([FLAT_ROW]);
    const ds = await openView(meta, FLAT_ID);
    await densityThenSort();

    expect(ds.updateViewConfig).toHaveBeenCalledTimes(2);
    expect(toast.error).not.toHaveBeenCalled();
    expect(bodies[1]).not.toHaveProperty('config');
    expect(bodies[1].rowHeight).toBe('medium');
    expect(bodies[1].sort).toEqual(HEADER_SORT);

    const stored = rows.get(FLAT_ID);
    expect(stored.rowHeight).toBe('medium');
    expect(stored.sort).toEqual(STORED_SORT);
    expect(stored.filter).toEqual(FLAT_ROW.filter);
    expect(stored.columns).toEqual(FLAT_ROW.columns);
    expect(stored).not.toHaveProperty('_isOverride');

    expect(await reload(meta, FLAT_ID)).toEqual({ rowHeight: 'medium', sort: STORED_SORT });
  });

  it('overlay: the overlay becomes the patches composed, and still freezes nothing the shadowed view owns', async () => {
    const { meta, rows, bodies } = makeStore([OVERLAY_ROW]);
    const ds = await openView(meta, OVERLAY_ID);
    await densityThenSort();

    expect(ds.updateViewConfig).toHaveBeenCalledTimes(2);
    expect(toast.error).not.toHaveBeenCalled();
    // Both writes take the overlay branch: the row keeps its marker.
    expect(ds.updateViewConfig.mock.calls.map((c: any[]) => c[3])).toEqual([
      { isSavedView: false },
      { isSavedView: false },
    ]);
    // The second body is the stored overlay plus the new patch — the earlier
    // session's column widths and this session's density ride along.
    expect(bodies[1].rowHeight).toBe('medium');
    expect(bodies[1].sort).toEqual(HEADER_SORT);
    expect(bodies[1].columnState).toEqual(OVERLAY_ROW.columnState);

    const stored = rows.get(OVERLAY_ID);
    expect(stored.rowHeight).toBe('medium');
    expect(stored.sort).toEqual(STORED_SORT);
    expect(stored.columnState).toEqual(OVERLAY_ROW.columnState);
    expect(stored._isOverride).toBe(true);
    // objectui#5233 — the console sends no copy of the source view's keys, on
    // the second composed write as on the first, and none is at rest.
    for (const body of bodies) {
      expect(body).not.toHaveProperty('filter');
      expect(body).not.toHaveProperty('columns');
      expect(body).not.toHaveProperty('label');
      expect(body).not.toHaveProperty('type');
      expect(body).not.toHaveProperty('config');
    }
    expect(stored).not.toHaveProperty('filter');
    expect(stored).not.toHaveProperty('columns');
    expect(stored).not.toHaveProperty('config');

    expect(await reload(meta, OVERLAY_ID)).toEqual({ rowHeight: 'medium', sort: STORED_SORT });
    // …and the source view's own filter still reaches the reloaded tab.
    expect(listSchema.filter).toEqual(DONE_SOURCE.filter);
  });
});

describe('objectui#11642 — the debounce and the write chain', () => {
  it('two changes inside the 300 ms debounce coalesce into ONE write carrying both', async () => {
    const { meta, rows } = makeStore([ENVELOPE_ROW]);
    const ds = await openView(meta, ENVELOPE_ID);
    act(() => listSchema.onDensityChange('comfortable'));
    await wait(50);
    act(() => listSchema.onSortChange(HEADER_SORT));
    await wait(700);

    expect(ds.updateViewConfig).toHaveBeenCalledTimes(1);
    const stored = rows.get(ENVELOPE_ID);
    expect(stored.config.rowHeight).toBe('medium');
    expect(stored.config.sort).toEqual(STORED_SORT);
  });

  it('a change made while the previous write is still in flight starts from the row that write stored', async () => {
    // The first PUT takes 500 ms. The sort is made 400 ms after the density,
    // so its debounce fires while that PUT is still in flight: a read taken
    // then returns the row from BEFORE the first write.
    const { meta, rows, bodies } = makeStore([ENVELOPE_ROW], { putDelayMs: (n) => (n === 1 ? 500 : 0) });
    const ds = await openView(meta, ENVELOPE_ID);
    await densityThenSort(400);
    await wait(600);

    expect(ds.updateViewConfig).toHaveBeenCalledTimes(2);
    expect(bodies[1].config.rowHeight).toBe('medium');
    const stored = rows.get(ENVELOPE_ID);
    expect(stored.config.rowHeight).toBe('medium');
    expect(stored.config.sort).toEqual(STORED_SORT);
  });
});
