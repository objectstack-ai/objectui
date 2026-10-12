/**
 * objectui#12187 — one `sys_user_preference` read per console load.
 *
 * ## The budget, and why it changed
 *
 * `ConnectedShell`'s `UserStateBridge` attaches three user-state adapters, one
 * per slot (`ui.favorites`, `ui.recent`, `ui.flow.palette.recents`), and each
 * slot is its own `(user, key)` row. objectui#5544 and objectui#11797 counted
 * that as three reads per load, one per key, and this file used to pin three.
 * objectui#12187 rules the budget at ONE: the adapters share one read of the
 * user's rows for the load, and each takes its own key from it.
 *
 * The hazard objectui#5544 named still stands: a dedup that serves one key's
 * answer to all three consumers makes the count look right and starves two of
 * them. So the count is pinned together with the payloads: every consumer
 * must still receive its own row.
 *
 * ## The tree
 *
 * The real `ConsoleShell` providers and the real `ConnectedShell`: its
 * `AdapterProvider` builds the real `ObjectStackAdapter` and client, and its
 * `UserStateBridge` builds the three adapters. The network is a fake framework
 * on the global `fetch` that answers preference reads the way the server does,
 * by `user_id` and by `key` (`=` or `in`), and refuses any other filter
 * operator loudly. Only the session is stood in.
 *
 * ## The pins
 *
 *   1. One boot puts ONE `sys_user_preference` GET on the wire, and it asks
 *      for the three keys.
 *   2. Every consumer receives its own row from that one answer.
 *   3. Each adapter still writes its own row, and only its own.
 *   4. Signing in as another user reads again, for that user, and every
 *      consumer ends on that user's rows.
 *   5. Two loads of one key at once are still one request.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEffect, type ReactNode } from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { session } = vi.hoisted(() => ({
  /** The signed-in user the mocked `useAuth` reports; switched per test. */
  session: { userId: 'u1' },
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    info: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn(),
    dismiss: vi.fn(), custom: vi.fn(), loading: vi.fn(), promise: vi.fn(),
  }),
  Toaster: () => null,
}));
// The ADR-0069 remediation gate needs an AuthProvider above it; not under test.
vi.mock('../RemediationOverlay', () => ({ RemediationOverlay: () => null }));
vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: { id: session.userId, email: `${session.userId}@example.com` },
    session: null,
    isAuthEnabled: true,
    error: null,
    organizations: [],
    activeOrganization: null,
    isOrganizationsLoading: false,
    getAuthConfig: async () => ({}),
  }),
  useWorkspaceAdminStatus: () => ({ isAdmin: false, isResolved: true }),
}));

import { ObjectStackAdapter, createObjectStackUserStateAdapter } from '@object-ui/data-objectstack';
import { ConsoleShell, ConnectedShell } from '../ConsoleShell';
import { useFavorites } from '../../context/FavoritesProvider';
import { useRecentItems } from '../../context/RecentItemsProvider';
import { useFlowPaletteRecents } from '../../context/FlowPaletteRecentsProvider';

const RESOURCE = 'sys_user_preference';
const FAVORITES_KEY = 'ui.favorites';
const RECENT_KEY = 'ui.recent';
const FLOW_KEY = 'ui.flow.palette.recents';
const BRIDGE_KEYS = [FAVORITES_KEY, RECENT_KEY, FLOW_KEY];

/** Each user's stored rows, one distinct payload per key, so a starved consumer shows up. */
const STORE: Record<string, Record<string, unknown[]>> = {
  u1: {
    [FAVORITES_KEY]: [{ id: 'object:contact', label: 'Contact', href: '/contact', type: 'object' }],
    [RECENT_KEY]: [{ id: 'object:lead', type: 'object', name: 'lead', href: '/lead', visitedAt: '2026-10-01T00:00:00.000Z' }],
    [FLOW_KEY]: ['flow_step_alpha'],
  },
  u2: {
    [FAVORITES_KEY]: [{ id: 'object:invoice', label: 'Invoice', href: '/invoice', type: 'object' }],
    [RECENT_KEY]: [{ id: 'object:quote', type: 'object', name: 'quote', href: '/quote', visitedAt: '2026-10-02T00:00:00.000Z' }],
    [FLOW_KEY]: ['flow_step_omega'],
  },
};

const rowId = (user: string, key: string) => `row-${user}-${key}`;

interface PrefRow { id: string; user_id: string; key: string; value: unknown }
type FilterNode = [string, ...unknown[]];

/** Answer one filter node the way the server's AST does, for the operators this path sends. */
function matches(node: FilterNode, row: PrefRow): boolean {
  const [head, ...rest] = node;
  if (head === 'and') return (rest as FilterNode[]).every((n) => matches(n, row));
  if (head === 'or') return (rest as FilterNode[]).some((n) => matches(n, row));
  const [op, value] = rest;
  const actual = (row as unknown as Record<string, unknown>)[head];
  if (op === '=') return actual === value;
  if (op === 'in') return Array.isArray(value) && value.includes(actual);
  throw new Error(`fake framework: filter operator ${String(op)} is not one this path sends`);
}

interface PrefGet { user: string | undefined; keys: string[]; top: string | null }
interface PrefWrite { method: string; id: string | undefined; value: unknown }

/** Every preference request the console made, read off the wire. */
const wire = { gets: [] as PrefGet[], writes: [] as PrefWrite[] };

/** Collect the `user_id` and the keys a filter asks for (`key = k` or `key in [...]`). */
function scopeOf(node: FilterNode, into: PrefGet): PrefGet {
  const [head, ...rest] = node;
  if (head === 'and' || head === 'or') {
    (rest as FilterNode[]).forEach((n) => scopeOf(n, into));
    return into;
  }
  const [op, value] = rest;
  if (head === 'user_id' && op === '=') into.user = String(value);
  if (head === 'key' && op === '=') into.keys.push(String(value));
  if (head === 'key' && op === 'in') into.keys.push(...(value as string[]));
  return into;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** The fake framework: discovery, empty metadata, and the preference rows of {@link STORE}. */
async function framework(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(raw, 'http://localhost/');
  const method = (init?.method ?? 'GET').toUpperCase();
  // A real round trip is not instantaneous; the gap is what lets two loads overlap.
  await new Promise((resolve) => setTimeout(resolve, 5));

  if (url.pathname.endsWith('/api/v1/discovery')) {
    return json(200, { success: true, data: { capabilities: {}, routes: {} } });
  }
  if (url.pathname.includes('/api/v1/meta/')) {
    return json(200, { success: true, data: { items: [] } });
  }
  const prefix = `/api/v1/data/${RESOURCE}`;
  if (url.pathname.startsWith(prefix)) {
    if (method === 'GET') {
      const filter = JSON.parse(url.searchParams.get('filter') ?? '["and"]') as FilterNode;
      wire.gets.push(scopeOf(filter, { user: undefined, keys: [], top: url.searchParams.get('top') }));
      const rows: PrefRow[] = Object.entries(STORE).flatMap(([user, byKey]) =>
        Object.entries(byKey).map(([key, value]) => ({ id: rowId(user, key), user_id: user, key, value })),
      );
      const top = Number(url.searchParams.get('top') ?? Infinity);
      const records = rows.filter((r) => matches(filter, r)).slice(0, top);
      return json(200, { success: true, data: { records, total: records.length } });
    }
    const id = url.pathname.slice(prefix.length + 1) || undefined;
    const body = init?.body ? (JSON.parse(String(init.body)) as { value?: unknown }) : {};
    wire.writes.push({ method, id, value: body.value });
    return json(200, { success: true, data: { object: RESOURCE, id, record: { id } } });
  }
  return json(404, {});
}

interface Seen {
  favorites: string[];
  recent: string[];
  flow: string[];
}

/**
 * Module-scope holders, written from an effect and never from the render phase
 * — the same shape `MetadataProvider.requestBudget.test.tsx` uses. Not props,
 * because writing through a prop is what the react-compiler rule refuses.
 */
const latest: { current: Seen } = { current: { favorites: [], recent: [], flow: [] } };
const actions: {
  current: {
    addFavorite?: ReturnType<typeof useFavorites>['addFavorite'];
    addRecentItem?: ReturnType<typeof useRecentItems>['addRecentItem'];
    recordRecent?: ReturnType<typeof useFlowPaletteRecents>['recordRecent'];
  };
} = { current: {} };

function Consumers() {
  const { favorites, addFavorite } = useFavorites();
  const { recentItems, addRecentItem } = useRecentItems();
  const { recents, recordRecent } = useFlowPaletteRecents();
  useEffect(() => {
    latest.current = {
      favorites: favorites.map((f) => f.id),
      recent: recentItems.map((r) => r.id),
      flow: [...recents],
    };
    actions.current = { addFavorite, addRecentItem, recordRecent };
  }, [favorites, recentItems, recents, addFavorite, addRecentItem, recordRecent]);
  return <main data-testid="content">content</main>;
}

function Console({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/apps/demo/page/welcome']}>
      <ConsoleShell>
        <ConnectedShell>{children}</ConnectedShell>
      </ConsoleShell>
    </MemoryRouter>
  );
}

function boot() {
  return render(<Console><Consumers /></Console>);
}

/** Let every pending effect, microtask and timer drain, so a LATE extra read is still counted. */
async function settle(ms = 150) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

const U1_SEEN: Seen = { favorites: ['object:contact'], recent: ['object:lead'], flow: ['flow_step_alpha'] };
const U2_SEEN: Seen = { favorites: ['object:invoice'], recent: ['object:quote'], flow: ['flow_step_omega'] };

describe('console sys_user_preference request budget (objectui#12187)', () => {
  beforeEach(() => {
    session.userId = 'u1';
    wire.gets.length = 0;
    wire.writes.length = 0;
    latest.current = { favorites: [], recent: [], flow: [] };
    actions.current = {};
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn(framework));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('one boot puts one sys_user_preference read on the wire, asking for the three keys', async () => {
    boot();
    await waitFor(() => expect(wire.gets.length).toBeGreaterThan(0));
    await settle();

    expect(wire.gets).toHaveLength(1);
    expect(wire.gets[0].user).toBe('u1');
    expect([...wire.gets[0].keys].sort()).toEqual([...BRIDGE_KEYS].sort());
  });

  it('every consumer receives its own row from that one answer', async () => {
    boot();
    // Three distinct payloads, three distinct consumers: an answer handed to
    // the wrong adapter, or to only one of them, fails here.
    await waitFor(() => expect(latest.current).toEqual(U1_SEEN));
    expect(wire.gets).toHaveLength(1);
  });

  it('each adapter still writes its own row, and only its own', async () => {
    boot();
    await waitFor(() => expect(latest.current).toEqual(U1_SEEN));
    await settle();
    expect(wire.writes).toEqual([]);

    act(() => {
      actions.current.addFavorite?.({ id: 'object:account', label: 'Account', href: '/account', type: 'object' });
      actions.current.addRecentItem?.({ id: 'object:deal', type: 'object', name: 'deal', href: '/deal' });
      actions.current.recordRecent?.('flow_step_beta');
    });

    // Each provider debounces its write (500 ms); all three land, once each.
    await waitFor(() => expect(wire.writes).toHaveLength(3), { timeout: 3000 });
    await settle();
    expect(wire.writes).toHaveLength(3);

    const byId = new Map(wire.writes.map((w) => [w.id, w]));
    // An update of the row its own load found — no insert, no other row.
    expect(wire.writes.every((w) => w.method === 'PATCH' || w.method === 'PUT')).toBe(true);
    expect([...byId.keys()].sort()).toEqual(BRIDGE_KEYS.map((k) => rowId('u1', k)).sort());
    expect((byId.get(rowId('u1', FAVORITES_KEY))?.value as { id: string }[]).map((f) => f.id)).toContain(
      'object:account',
    );
    expect((byId.get(rowId('u1', RECENT_KEY))?.value as { id: string }[])[0].id).toBe('object:deal');
    expect(byId.get(rowId('u1', FLOW_KEY))?.value).toEqual(['flow_step_beta', 'flow_step_alpha']);
    // A write found its row from the load: it asked the server nothing more.
    expect(wire.gets).toHaveLength(1);
  });

  it('signing in as another user reads again, for that user, and ends on that user\'s rows', async () => {
    const { rerender } = boot();
    await waitFor(() => expect(latest.current).toEqual(U1_SEEN));
    await settle();
    const before = wire.gets.length;

    session.userId = 'u2';
    rerender(<Console><Consumers /></Console>);

    await waitFor(() => expect(latest.current).toEqual(U2_SEEN));
    await settle();

    const afterSwitch = wire.gets.slice(before);
    const forU2 = afterSwitch.filter((g) => g.user === 'u2');
    // One read for the new user, asking for all three keys.
    expect(forU2).toHaveLength(1);
    expect([...forU2[0].keys].sort()).toEqual([...BRIDGE_KEYS].sort());
    // No u2 read was answered with u1's rows: every consumer shows u2's.
    expect(latest.current).toEqual(U2_SEEN);
  });

  it('two loads of one key at once are still one request', async () => {
    const ds = new ObjectStackAdapter({ baseUrl: 'http://test.local', fetch: framework as typeof fetch, autoReconnect: false });
    await ds.connect();
    const a = createObjectStackUserStateAdapter({ dataSource: ds, userId: 'u1', key: FAVORITES_KEY });
    const b = createObjectStackUserStateAdapter({ dataSource: ds, userId: 'u1', key: FAVORITES_KEY });

    const [first, second] = await Promise.all([a.load(), b.load()]);

    expect(wire.gets).toHaveLength(1);
    expect(wire.gets[0].keys).toEqual([FAVORITES_KEY]);
    expect(first).toEqual(STORE.u1[FAVORITES_KEY]);
    expect(second).toEqual(STORE.u1[FAVORITES_KEY]);
  });
});
