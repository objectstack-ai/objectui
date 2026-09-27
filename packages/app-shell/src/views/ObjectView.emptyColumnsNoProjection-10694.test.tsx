/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10694 — on the object route, a view that declares no `columns`
 * applies neither `hiddenFields` nor `fieldOrder`.
 *
 * ## The contract
 *
 * `ListViewSchema.columns` in `@objectstack/spec` source at objectstack
 * `origin/main` (objectstack#19598, not yet in the released 17.4.0): "An empty
 * list declares no projection, so neither of them applies: which columns show
 * is then left to the renderer". The composition docblock says the same: "An
 * EMPTY `columns` declares no projection, so steps 2 and 3 do not apply".
 * `InterfaceListPage` already reads a source view that way (objectui#10638).
 *
 * ## The defect this pins
 *
 * The views memo draws the object's default columns into a grid-like view that
 * declares none. The relay then applied that view's `hiddenFields` and
 * `fieldOrder` over those defaults, so the defaults came out subtracted and
 * re-sorted.
 *
 * ## The hide-column toggle on such a view (ruling 5839344270, B)
 *
 * With neither key applied, a `hiddenFields` the toggle persisted into a SYSTEM
 * view's overlay would be read by nothing on reload, and that overlay cannot
 * carry `columns` (`VIEW_OVERLAY_OWNED_KEYS`). So on a system view that
 * declares no projection the toggle is session-only: it hides the column in
 * `ListView`'s own state and writes nothing. A SAVED view's write is the whole
 * view, drawn `columns` included, so it keeps persisting and the reload
 * applies it.
 *
 * ## A config-panel draft is not a declaration
 *
 * `ViewConfigPanel` seeds its draft from the active view, whose `columns` on an
 * unprojected tab are the defaults the views memo drew, and it relays every
 * field on every edit and again on Discard. Those drawn defaults do not count
 * as a declared projection; only `columns` the admin changed do.
 *
 * ## What this file measures
 *
 * The column list the grid is handed, from a real `ObjectView` mount: the
 * real `plugin-view` host, the real `ListView`, and only `object-grid` stubbed
 * so it records its `columns`. The renderer's own columns are read off a view
 * that declares no projection and carries neither key, so the defaults are
 * never restated here. The toggle is driven through `ListView`'s own hide-fields
 * popover, and the writes are read off the data source's `updateViewConfig`.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ComponentRegistry } from '@object-ui/core';

vi.mock('@object-ui/permissions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@object-ui/permissions')>();
  // Stable identities — `ListView` names `perms` in its fetch dependencies.
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
  // The view config panel is admin-only.
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

// The real `ViewConfigPanel` runs (its draft seeding, its relay of every flat
// field, its Discard); only its heavy spec-driven inspector is swapped for two
// edits: one to an unrelated field, one to `columns`.
vi.mock('./metadata-admin/inspectors/ViewVariantInspector', () => ({
  ViewVariantInspector: ({ draft, onPatch }: any) => (
    <div>
      <button
        type="button"
        data-testid="inspector-edit-unrelated"
        onClick={() => onPatch({ config: { ...(draft?.config ?? {}), wrapHeaders: true } })}
      >
        unrelated
      </button>
      <button
        type="button"
        data-testid="inspector-edit-columns"
        onClick={() => onPatch({ config: { ...(draft?.config ?? {}), columns: ['name', 'stage', 'owner'] } })}
      >
        columns
      </button>
    </div>
  ),
}));
// The ADR-0034 draft/publish chrome does its own metadata reads.
vi.mock('./RuntimeDraftBar', () => ({ RuntimeDraftBar: () => null }));

// The host opens the panel from the plugin's `settings` view action. The plugin
// draws that action only inside its view switcher, so a button here calls the
// host's own `onViewAction` handler, and the real plugin view renders beside it.
vi.mock('@object-ui/plugin-view', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@object-ui/plugin-view')>();
  const Real = actual.ObjectView as React.ComponentType<any>;
  return {
    ...actual,
    ObjectView: (props: any) => (
      <>
        <button type="button" data-testid="open-view-settings" onClick={() => props.onViewAction?.('settings', 'grid')}>
          settings
        </button>
        <Real {...props} />
      </>
    ),
  };
});

import { ObjectView } from './ObjectView';
import { ExpressionProvider } from '../providers/ExpressionProvider';

const OBJECT_NAME = 'duly_task';

/** The column identities the grid was last handed. */
let drawn: string[] | undefined;
/** The `wrapHeaders` the grid was last handed: the panel's unrelated edit. */
let drawnWrapHeaders: unknown;

// `ListView` draws its rows through `object-grid`. The stub records what it is
// handed and nothing else, so what the grid would derive on its own stays out
// of the measurement.
let prevObjectGrid: unknown;
beforeAll(() => {
  prevObjectGrid = ComponentRegistry.get('object-grid');
  ComponentRegistry.register('object-grid', ((props: { schema?: { columns?: unknown; wrapHeaders?: unknown } }) => {
    const cols = props.schema?.columns;
    drawnWrapHeaders = props.schema?.wrapHeaders;
    drawn = Array.isArray(cols)
      ? cols.map((c: any) => (typeof c === 'string' ? c : (c?.field ?? c?.name)))
      : undefined;
    return <div data-testid="grid-stub" />;
  }) as never);
});
afterAll(() => {
  if (prevObjectGrid) ComponentRegistry.register('object-grid', prevObjectGrid as never);
  else ComponentRegistry.unregister('object-grid');
});

const FIELDS = {
  id: { type: 'text', label: 'Id' },
  name: { type: 'text', label: 'Name' },
  stage: { type: 'text', label: 'Stage' },
  owner: { type: 'text', label: 'Owner' },
  amount: { type: 'number', label: 'Amount' },
  region: { type: 'text', label: 'Region' },
};

/** Both composition keys. Each would change the defaults if applied. */
const KEYS = { hiddenFields: ['stage'], fieldOrder: ['owner', 'name'] };

const PROBE_ID = `${OBJECT_NAME}.probe`;

/** A data source with one row, so `ListView` draws the grid rather than its empty state. */
function makeDataSource(extra: Record<string, unknown> = {}) {
  return {
    find: vi.fn(async () => ({ data: [{ id: 'r1', name: 'Row one' }], total: 1 })),
    findOne: vi.fn(async () => null),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
    ...extra,
  } as any;
}

/** Mount the object route on `viewId` and wait until the grid is drawn. */
async function mountRoute(listViews: Record<string, unknown>, viewId: string, dataSource: any): Promise<void> {
  const objects = [{ name: OBJECT_NAME, label: 'Task', fields: FIELDS, listViews }];
  drawn = undefined;
  render(
    <ExpressionProvider user={{ id: 'u1', name: 'Ada', profile: 'user' }}>
      <MemoryRouter initialEntries={[`/apps/demo/${OBJECT_NAME}/view/${viewId}`]}>
        <Routes>
          <Route
            path="/apps/:appName/:objectName/view/:viewId"
            element={<ObjectView dataSource={dataSource} objects={objects} onEdit={() => {}} />}
          />
        </Routes>
      </MemoryRouter>
    </ExpressionProvider>,
  );
  await screen.findByTestId('grid-stub', undefined, { timeout: 8000 });
}

/** Draw one system list view on the object route; return the columns the grid got. */
async function drawView(view: Record<string, unknown>): Promise<string[] | undefined> {
  await mountRoute({ [PROBE_ID]: { name: PROBE_ID, label: 'Probe', type: 'grid', ...view } }, PROBE_ID, makeDataSource());
  const got = drawn;
  cleanup();
  return got;
}

/** Untick `field` in `ListView`'s hide-fields popover, as a user does. */
async function hideThroughToggle(field: string): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: /hide fields/i }));
  await screen.findByText('Hide Fields');
  const label = await screen.findByText(new RegExp(`^${field}$`, 'i'));
  fireEvent.click(label.closest('label')!.querySelector('input')!);
}

/** The `updateViewConfig` calls whose body carries `hiddenFields`. */
const hiddenFieldsWrites = (dataSource: any) =>
  dataSource.updateViewConfig.mock.calls.filter((call: any[]) => call[2] && 'hiddenFields' in call[2]);

/** Longer than `persistViewPatch`'s 300ms debounce, with room to spare. */
const PAST_DEBOUNCE_MS = 900;

/** Open the view config panel on the active view, as the host's `settings` action does. */
async function openPanel(): Promise<void> {
  fireEvent.click(screen.getByTestId('open-view-settings'));
  await screen.findByTestId('inspector-edit-unrelated');
}

/** Edit a field that is not `columns`, and wait until the edit reaches the grid. */
async function editUnrelatedField(): Promise<void> {
  fireEvent.click(screen.getByTestId('inspector-edit-unrelated'));
  await waitFor(() => expect(drawnWrapHeaders).toBe(true));
}

/** Discard the panel, and wait until the revert reaches the grid. */
async function discardPanel(): Promise<void> {
  fireEvent.click(screen.getByTestId('view-config-discard'));
  await waitFor(() => expect(drawnWrapHeaders).toBeUndefined());
}

/** The unprojected view the panel cases edit: both keys, and the hide toggle on. */
const UNPROJECTED_WITH_TOGGLE = {
  [PROBE_ID]: {
    name: PROBE_ID, label: 'Probe', type: 'grid',
    columns: [], ...KEYS, userActions: { hideFields: true },
  },
};

/** The toggle on an unprojected system view hides in-session and writes nothing. */
async function expectSessionOnlyToggle(dataSource: any): Promise<void> {
  await hideThroughToggle('region');
  await waitFor(() => expect(drawn).not.toContain('region'));
  await new Promise((resolve) => setTimeout(resolve, PAST_DEBOUNCE_MS));
  expect(hiddenFieldsWrites(dataSource)).toEqual([]);
}

beforeEach(() => {
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
  cleanup();
  vi.unstubAllGlobals();
});

describe('an unprojected view applies neither hiddenFields nor fieldOrder on the object route (objectui#10694)', () => {
  it('THE FIX: `columns: []` with both keys draws the renderer\'s own columns', async () => {
    const own = await drawView({ columns: [] });
    // The fixture discriminates: applying `hiddenFields` would drop `stage`,
    // and applying `fieldOrder` would put `owner` ahead of `name`.
    expect(own).toContain('stage');
    expect(own!.indexOf('name')).toBeLessThan(own!.indexOf('owner'));

    expect(await drawView({ columns: [], ...KEYS })).toEqual(own);
  });

  it('THE FIX: an ABSENT `columns` reads as an empty one', async () => {
    // The spec requires the key, so a view without it declares no projection
    // either. The shape still reaches this route from a stored view body.
    const own = await drawView({ columns: [] });
    expect(await drawView({ ...KEYS })).toEqual(own);
  });

  it('CONTROL: a declared projection is subtracted and sorted, as before', async () => {
    // `columns` projects, `hiddenFields` removes `stage`, `fieldOrder` sorts
    // `owner` and `name` first and leaves the unlisted `amount` last.
    expect(await drawView({ columns: ['name', 'stage', 'owner', 'amount'], ...KEYS }))
      .toEqual(['owner', 'name', 'amount']);
  });

  it('THE FIX: on a system view with no declared `columns`, the hide toggle is session-only', async () => {
    const dataSource = makeDataSource({ updateViewConfig: vi.fn(async () => ({})) });
    await mountRoute(
      { [PROBE_ID]: { name: PROBE_ID, label: 'Probe', type: 'grid', columns: [], userActions: { hideFields: true } } },
      PROBE_ID,
      dataSource,
    );
    expect(drawn).toContain('region');

    await hideThroughToggle('region');
    // The column goes, in this session.
    await waitFor(() => expect(drawn).not.toContain('region'));
    // And nothing is written: an overlay `hiddenFields` on this view would be
    // read by nothing on reload (the CONTROL below shows the write is live).
    await new Promise((resolve) => setTimeout(resolve, PAST_DEBOUNCE_MS));
    expect(hiddenFieldsWrites(dataSource)).toEqual([]);
  });

  it('CONTROL: on a system view that declares `columns`, the toggle still persists to the overlay', async () => {
    const dataSource = makeDataSource({ updateViewConfig: vi.fn(async () => ({})) });
    await mountRoute(
      {
        [PROBE_ID]: {
          name: PROBE_ID, label: 'Probe', type: 'grid',
          columns: ['name', 'stage', 'region'], userActions: { hideFields: true },
        },
      },
      PROBE_ID,
      dataSource,
    );
    await hideThroughToggle('region');
    await waitFor(() => expect(hiddenFieldsWrites(dataSource)).toHaveLength(1), { timeout: 3000 });
    const [, viewId, body, opts] = hiddenFieldsWrites(dataSource)[0];
    expect(viewId).toBe(PROBE_ID);
    expect(body).toEqual({ hiddenFields: ['region'] });
    expect(opts).toEqual({ isSavedView: false });
  });

  it('CONTROL: a saved view with no `columns` keeps persisting, and the reload applies it', async () => {
    const savedId = `${OBJECT_NAME}.mine`;
    const savedRow = { name: savedId, label: 'Mine', type: 'grid', userActions: { hideFields: true } };
    // A system view beside it, so the saved one is not the only tab.
    const systemViews = {
      [`${OBJECT_NAME}.other`]: { name: `${OBJECT_NAME}.other`, label: 'Other', type: 'grid', columns: ['name'] },
    };

    const first = makeDataSource({
      updateViewConfig: vi.fn(async () => ({})),
      listViews: vi.fn(async () => [savedRow]),
    });
    await mountRoute(systemViews, savedId, first);
    await waitFor(() => expect(drawn).toContain('region'), { timeout: 5000 });
    await hideThroughToggle('region');
    await waitFor(() => expect(hiddenFieldsWrites(first)).toHaveLength(1), { timeout: 3000 });
    const [, viewId, body, opts] = hiddenFieldsWrites(first)[0];
    expect(viewId).toBe(savedId);
    expect(opts).toEqual({ isSavedView: true });
    // The whole view is written, the drawn columns with it: the reload reads
    // a view that declares a projection.
    expect(body.hiddenFields).toEqual(['region']);
    expect(Array.isArray(body.columns) && body.columns.length > 0).toBe(true);
    expect(body.columns).toContain('region');
    cleanup();

    // Reload: the saved row is now what the toggle wrote.
    const reloaded = makeDataSource({ listViews: vi.fn(async () => [body]) });
    await mountRoute(systemViews, savedId, reloaded);
    await waitFor(() => expect(drawn).toEqual(body.columns.filter((c: string) => c !== 'region')), { timeout: 5000 });
  });

  it('THE FIX: after a panel edit of an unrelated field, the view stays unprojected', async () => {
    const own = await drawView({ columns: [] });
    await mountRoute(UNPROJECTED_WITH_TOGGLE, PROBE_ID, makeDataSource());
    expect(drawn).toEqual(own);

    await openPanel();
    await editUnrelatedField();
    // The panel's draft now carries the drawn defaults as `columns`.
    expect(drawn).toEqual(own);
  });

  it('THE FIX: after a panel edit of an unrelated field, the system view\'s hide toggle stays session-only', async () => {
    const dataSource = makeDataSource({ updateViewConfig: vi.fn(async () => ({})) });
    await mountRoute(UNPROJECTED_WITH_TOGGLE, PROBE_ID, dataSource);
    await openPanel();
    await editUnrelatedField();
    await expectSessionOnlyToggle(dataSource);
  });

  it('THE FIX: after a panel edit and Discard, the view stays unprojected', async () => {
    const own = await drawView({ columns: [] });
    await mountRoute(UNPROJECTED_WITH_TOGGLE, PROBE_ID, makeDataSource());
    await openPanel();
    await editUnrelatedField();
    await discardPanel();
    // Discard replays the opening fields, drawn `columns` included.
    expect(drawn).toEqual(own);
  });

  it('THE FIX: after a panel edit and Discard, the system view\'s hide toggle stays session-only', async () => {
    const dataSource = makeDataSource({ updateViewConfig: vi.fn(async () => ({})) });
    await mountRoute(UNPROJECTED_WITH_TOGGLE, PROBE_ID, dataSource);
    await openPanel();
    await editUnrelatedField();
    await discardPanel();
    await expectSessionOnlyToggle(dataSource);
  });

  it('CONTROL: `columns` the admin changed in the panel answer for themselves, and the keys apply', async () => {
    await mountRoute(UNPROJECTED_WITH_TOGGLE, PROBE_ID, makeDataSource());
    await openPanel();
    fireEvent.click(screen.getByTestId('inspector-edit-columns'));
    // [name, stage, owner] projected; `stage` hidden; `owner` sorted first.
    await waitFor(() => expect(drawn).toEqual(['owner', 'name']));
  });
});
