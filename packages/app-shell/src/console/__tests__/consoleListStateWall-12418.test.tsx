/**
 * objectui#12418 — a user's list state under a walled posture.
 *
 * Under a `group` (or `isolated`) posture the platform refuses an environment
 * metadata write to everyone but the platform operator (objectstack
 * `walledCatalogWriteVerdict`). A header sort and a Manage Views drag used to
 * be such writes: the sort PUT the view, the drag PATCHed a `sortOrder` onto
 * every saved view, so a workspace admin who is not the operator got an error
 * for a personal preference. They are the user's own list state now, a
 * `sys_user_preference` row: an organization row the tenant's user may write
 * under every posture.
 *
 * ## The tree
 *
 * The real `ConsoleShell` providers, the real `ConnectedShell` (its real
 * `ObjectStackAdapter`, its `UserStateBridge` and the list-state family), and
 * the real object page inside it, over the fake framework the preference
 * budget pin uses (`preferenceFramework.ts`), here WALLED: every metadata
 * write is answered 403. The session reports the `group` posture and a
 * workspace admin who is not the platform operator. `ListView` is captured
 * (a toolbar change is the page's own callback) and Manage Views is reduced
 * to its reorder.
 *
 * ## The pins
 *
 *   1. A header sort and a drag-reorder put NO metadata write on the wire,
 *      raise no error, and land as ONE preference write of the object's row.
 *   2. CONTROL — the wall is live: a change that is still a VIEW write (the
 *      density) is refused by it, and the refusal is said.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    info: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn(),
    dismiss: vi.fn(), custom: vi.fn(), loading: vi.fn(), promise: vi.fn(),
  }),
  Toaster: () => null,
}));
vi.mock('../RemediationOverlay', () => ({ RemediationOverlay: () => null }));
vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: { id: 'u1', email: 'u1@example.com', name: 'Ada' },
    session: null,
    isAuthEnabled: true,
    error: null,
    organizations: [],
    activeOrganization: null,
    isOrganizationsLoading: false,
    // A walled posture.
    getAuthConfig: async () => ({ features: { tenancyPosture: 'group' } }),
  }),
  // A workspace admin: Manage Views is offered. Not the platform operator: the
  // wall refuses their metadata writes (the fake framework's `walled`).
  useWorkspaceAdminStatus: () => ({ isAdmin: true, isResolved: true }),
}));
vi.mock('@object-ui/permissions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@object-ui/permissions')>();
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
vi.mock('@object-ui/collaboration', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRealtimeSubscription: () => ({ lastMessage: null }),
  useConflictResolution: () => ({ hasConflicts: false, resolveAllConflicts: () => {} }),
}));
vi.mock('../../views/MetadataInspector', () => ({
  MetadataPanel: () => null,
  useMetadataInspector: () => ({ showDebug: false, toggle: () => {} }),
}));
vi.mock('../../views/RecordDetailView', () => ({ RecordDetailView: () => null }));

/** The props the object page hands its list: captured, not rendered. */
let listProps: any = null;
vi.mock('@object-ui/plugin-list', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@object-ui/plugin-list')>()),
  ListView: (props: any) => {
    listProps = props;
    return null;
  },
}));

const OBJECT_NAME = 'account';
const ALL_ID = `${OBJECT_NAME}.all`;
const MINE_ID = `${OBJECT_NAME}.mine`;

vi.mock('@object-ui/plugin-view', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@object-ui/plugin-view')>()),
  ManageViewsDialog: (props: any) => (
    <button type="button" data-testid="stub-reorder" onClick={() => props.onReorder?.([MINE_ID, ALL_ID])}>reorder</button>
  ),
}));

import { toast } from 'sonner';
import { ConsoleShell, ConnectedShell } from '../ConsoleShell';
import { useAdapter } from '../../providers/AdapterProvider';
import { ObjectView } from '../../views/ObjectView';
import { createPreferenceFramework, preferenceRowId, type PreferenceFramework } from './preferenceFramework';

const FIELDS = {
  id: { type: 'text', label: 'Id' },
  name: { type: 'text', label: 'Name' },
};
const OBJECT = {
  name: OBJECT_NAME,
  label: 'Account',
  fields: FIELDS,
  listViews: {
    [ALL_ID]: { name: ALL_ID, label: 'All', type: 'grid', columns: ['name'], sort: [{ field: 'name', order: 'asc' }] },
    [MINE_ID]: { name: MINE_ID, label: 'Mine', type: 'grid', columns: ['name'] },
  },
};

/** The user already has a list-state row for the object (from another device). */
const STORE = { u1: { 'ui.list.account': { viewOrder: [ALL_ID, MINE_ID] } } };

let fake: PreferenceFramework;

/** The object page over the shell's adapter, as the console's routes mount it. */
function Page() {
  const adapter = useAdapter();
  if (!adapter) return null;
  return <ObjectView dataSource={adapter as any} objects={[OBJECT as any]} onEdit={() => {}} />;
}

function boot() {
  return render(
    <MemoryRouter initialEntries={[`/apps/demo/${OBJECT_NAME}/view/${ALL_ID}`]}>
      <ConsoleShell>
        <ConnectedShell>
          <Routes>
            <Route path="/apps/:appName/:objectName/view/:viewId" element={<Page />} />
          </Routes>
        </ConnectedShell>
      </ConsoleShell>
    </MemoryRouter>,
  );
}

const wait = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));

beforeEach(() => {
  listProps = null;
  localStorage.clear();
  fake = createPreferenceFramework(STORE, { walled: true });
  vi.stubGlobal('fetch', vi.fn(fake.fetch));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('a user\'s list state under a walled posture (objectui#12418)', () => {
  it('a header sort and a drag-reorder write no metadata, raise no error, and land as one preference write', async () => {
    boot();
    await waitFor(() => expect(typeof listProps?.onSortChange).toBe('function'), { timeout: 5000 });
    await screen.findByTestId('stub-reorder');
    await wait(100);
    const readsBefore = fake.wire.gets.length;

    act(() => {
      listProps.onSortChange([{ id: 'row-1', field: 'name', order: 'desc' }]);
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('stub-reorder'));
    });
    // Past the preference debounce (500 ms) and the round trip.
    await waitFor(() => expect(fake.wire.writes).toHaveLength(1), { timeout: 3000 });
    await wait(400);

    expect(fake.wire.metaWrites).toEqual([]);
    expect(toast.error).not.toHaveBeenCalled();
    expect(fake.wire.writes).toHaveLength(1);
    const [write] = fake.wire.writes;
    // An update of the row the boot read found: no second read, no insert.
    expect(write.id).toBe(preferenceRowId('u1', 'ui.list.account'));
    expect(fake.wire.gets.length).toBe(readsBefore);
    expect(write.value).toEqual({
      viewOrder: [MINE_ID, ALL_ID],
      perView: { [ALL_ID]: { sort: [{ field: 'name', order: 'desc' }] } },
    });
  });

  it('CONTROL: the wall is live — a change that is still a view write (the density) is refused, and said', async () => {
    boot();
    await waitFor(() => expect(typeof listProps?.schema?.onDensityChange).toBe('function'), { timeout: 5000 });
    await wait(100);

    act(() => {
      listProps.schema.onDensityChange('compact');
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalled(), { timeout: 3000 });
    expect(fake.wire.metaWrites.length).toBeGreaterThan(0);
    expect(fake.wire.writes).toEqual([]);
  });
});
