/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const mockUser = { current: { id: 'user-1', name: 'Alice', email: 'a@x' } as any | null };
vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ user: mockUser.current, isAuthenticated: !!mockUser.current, isLoading: false }),
}));

import {
  RecentItemsProvider,
  useRecentItems,
  type RecentItem,
} from '../RecentItemsProvider';
import {
  UserStateAdaptersProvider,
  useAttachUserStateAdapters,
  type UserDataAdapter,
} from '../UserStateAdapters';

function makeAdapter(initial: RecentItem[] = []) {
  const loadMock = vi.fn().mockResolvedValue(initial);
  const saveMock = vi.fn().mockResolvedValue(undefined);
  return { load: loadMock, save: saveMock, loadMock, saveMock } as UserDataAdapter<RecentItem> & {
    loadMock: ReturnType<typeof vi.fn>;
    saveMock: ReturnType<typeof vi.fn>;
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <UserStateAdaptersProvider>
      <RecentItemsProvider>{children}</RecentItemsProvider>
    </UserStateAdaptersProvider>
  );
}

function useHarness() {
  const attach = useAttachUserStateAdapters();
  const recent = useRecentItems();
  return { attach, recent };
}

describe('RecentItemsProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUser.current = { id: 'user-1', name: 'Alice', email: 'a@x' } as any;
  });

  it('hydrates synchronously from user-scoped localStorage on mount', () => {
    const seeded: RecentItem[] = [
      { id: 'object:c', type: 'object', name: 'c', href: '/c', visitedAt: '2024-01-01' },
    ];
    localStorage.setItem('objectui-recent-items:u:user-1', JSON.stringify(seeded));

    const { result } = renderHook(() => useRecentItems(), { wrapper });
    expect(result.current.recentItems).toEqual(seeded);
  });

  it('addRecentItem prepends and updates timestamp on revisit', () => {
    const { result } = renderHook(() => useRecentItems(), { wrapper });

    act(() => result.current.addRecentItem({ id: 'object:a', type: 'object', name: 'a', href: '/a' }));
    act(() => result.current.addRecentItem({ id: 'object:b', type: 'object', name: 'b', href: '/b' }));
    act(() => result.current.addRecentItem({ id: 'object:a', type: 'object', name: 'a', href: '/a' }));

    // 'a' moves back to the front; no duplicate.
    expect(result.current.recentItems.map(r => r.id)).toEqual(['object:a', 'object:b']);
  });

  it('caps recent items at 8', () => {
    const { result } = renderHook(() => useRecentItems(), { wrapper });

    act(() => {
      for (let i = 0; i < 12; i++) {
        result.current.addRecentItem({
          id: `object:r-${i}`,
          type: 'object',
          name: `r-${i}`,
          href: `/r/${i}`,
        });
      }
    });

    expect(result.current.recentItems).toHaveLength(8);
    // Most recent first.
    expect(result.current.recentItems[0].id).toBe('object:r-11');
  });

  it('persists to user-scoped localStorage only', () => {
    const { result } = renderHook(() => useRecentItems(), { wrapper });

    act(() =>
      result.current.addRecentItem({ id: 'page:x', type: 'page', name: 'x', href: '/x' }),
    );

    expect(localStorage.getItem('objectui-recent-items')).toBeNull();
    const stored = JSON.parse(localStorage.getItem('objectui-recent-items:u:user-1') || '[]');
    expect(stored[0]).toMatchObject({ id: 'page:x', type: 'page', name: 'x' });
  });

  it('hydrates from adapter and overrides localStorage state', async () => {
    localStorage.setItem(
      'objectui-recent-items:u:user-1',
      JSON.stringify([{ id: 'object:local', type: 'object', name: 'local', href: '/l', visitedAt: 't' }]),
    );
    const remote: RecentItem[] = [
      { id: 'dashboard:remote', type: 'dashboard', name: 'remote', href: '/r', visitedAt: 't' },
    ];
    const adapter = makeAdapter(remote);

    const { result } = renderHook(() => useHarness(), { wrapper });
    expect(result.current.recent.recentItems.map(r => r.id)).toEqual(['object:local']);

    act(() => result.current.attach('recent', adapter));

    await waitFor(() => {
      expect(result.current.recent.recentItems.map(r => r.id)).toEqual(['dashboard:remote']);
    });
    expect(JSON.parse(localStorage.getItem('objectui-recent-items:u:user-1') || '[]')).toEqual(remote);
  });

  it('debounces adapter.save() across a burst of additions', async () => {
    const adapter = makeAdapter([]);
    const { result } = renderHook(() => useHarness(), { wrapper });

    act(() => result.current.attach('recent', adapter));
    await waitFor(() => expect(adapter.loadMock).toHaveBeenCalled());
    adapter.saveMock.mockClear();

    act(() => {
      result.current.recent.addRecentItem({ id: 'object:1', type: 'object', name: '1', href: '/1' });
      result.current.recent.addRecentItem({ id: 'object:2', type: 'object', name: '2', href: '/2' });
      result.current.recent.addRecentItem({ id: 'object:3', type: 'object', name: '3', href: '/3' });
    });

    expect(adapter.saveMock).not.toHaveBeenCalled();
    await waitFor(() => expect(adapter.saveMock).toHaveBeenCalledTimes(1), { timeout: 1500 });

    const persisted = adapter.saveMock.mock.calls[0][0] as RecentItem[];
    expect(persisted.map(p => p.id).sort()).toEqual(['object:1', 'object:2', 'object:3']);
  });

  it('clearRecentItems empties the list and persists []', () => {
    const { result } = renderHook(() => useRecentItems(), { wrapper });

    act(() => result.current.addRecentItem({ id: 'object:a', type: 'object', name: 'a', href: '/a' }));
    act(() => result.current.clearRecentItems());

    expect(result.current.recentItems).toEqual([]);
    expect(localStorage.getItem('objectui-recent-items:u:user-1')).toBe('[]');
  });

  it('returns a no-op when used outside a provider', () => {
    const { result } = renderHook(() => useRecentItems());
    expect(result.current.recentItems).toEqual([]);
    expect(() =>
      result.current.addRecentItem({ id: 'object:x', type: 'object', name: 'x', href: '/x' }),
    ).not.toThrow();
  });
});

/**
 * objectui#11678 — "a visit that does not change the list writes nothing" is a
 * property of the STORE, not of whoever reports the visit: the route tracker,
 * a record page, a host's own call. Each write the provider makes is a
 * localStorage write plus an `adapter.save()` — a `sys_user_preference` PATCH
 * and an audit row — so these count both.
 */
describe('RecentItemsProvider — no change, no write (objectui#11678)', () => {
  const KEY = 'objectui-recent-items:u:user-1';

  beforeEach(() => {
    localStorage.clear();
  });

  /** An attached, hydrated adapter whose saves are counted from zero. */
  async function mountWithAdapter() {
    const adapter = makeAdapter([]);
    const view = renderHook(() => useHarness(), { wrapper });
    act(() => view.result.current.attach('recent', adapter));
    await waitFor(() => expect(adapter.loadMock).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    adapter.saveMock.mockClear();
    return { ...view, adapter };
  }

  /** Every localStorage write to the recent-items key, counted. */
  function countStorageWrites() {
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    return {
      count: () => spy.mock.calls.filter(([key]) => key === KEY).length,
      restore: () => spy.mockRestore(),
    };
  }

  it('re-adding the entry already at the head writes nothing — not even a fresher visitedAt', async () => {
    const { result, adapter } = await mountWithAdapter();
    act(() =>
      result.current.recent.addRecentItem({ id: 'dashboard:ops', type: 'dashboard', name: 'ops', href: '/d/ops' }),
    );
    await waitFor(() => expect(adapter.saveMock).toHaveBeenCalledTimes(1), { timeout: 1500 });
    const visitedAt = result.current.recent.recentItems[0].visitedAt;

    const writes = countStorageWrites();
    try {
      act(() =>
        result.current.recent.addRecentItem({ id: 'dashboard:ops', type: 'dashboard', name: 'ops', href: '/d/ops' }),
      );
      await new Promise(r => setTimeout(r, 700));
      expect(writes.count()).toBe(0);
    } finally {
      writes.restore();
    }
    expect(adapter.saveMock).toHaveBeenCalledTimes(1);
    expect(result.current.recent.recentItems[0].visitedAt).toBe(visitedAt);
  });

  it('clearing an already-empty list writes nothing', async () => {
    const { result, adapter } = await mountWithAdapter();
    const writes = countStorageWrites();
    try {
      act(() => result.current.recent.clearRecentItems());
      await new Promise(r => setTimeout(r, 700));
      expect(writes.count()).toBe(0);
    } finally {
      writes.restore();
    }
    expect(adapter.saveMock).not.toHaveBeenCalled();
  });

  it('control: a head whose content changed (a record title that resolved) IS written', async () => {
    const { result, adapter } = await mountWithAdapter();
    act(() =>
      result.current.recent.addRecentItem({ id: 'record:acct:1', type: 'record', label: 'acct-1', href: '/r/1' }),
    );
    await waitFor(() => expect(adapter.saveMock).toHaveBeenCalledTimes(1), { timeout: 1500 });
    act(() =>
      result.current.recent.addRecentItem({ id: 'record:acct:1', type: 'record', label: 'Acme Corp', href: '/r/1' }),
    );
    await waitFor(() => expect(adapter.saveMock).toHaveBeenCalledTimes(2), { timeout: 1500 });
    expect(result.current.recent.recentItems).toEqual([
      { id: 'record:acct:1', type: 'record', label: 'Acme Corp', href: '/r/1', visitedAt: expect.any(String) },
    ]);
  });
});

/**
 * objectui#11678 — the lists already in users' `ui.recent` rows carry the old
 * shape: an object / dashboard / page / report entry with a `label` minted at
 * visit time ("Showcase Ops Dashboard") and no `name`. The reader keeps the
 * entry and drops the minted text: the identity was always in `id`
 * (`<type>:<name>`), so the item's current label replaces it on render.
 */
describe('RecentItemsProvider — reading a list stored before the identity shape (objectui#11678)', () => {
  const LEGACY = [
    {
      id: 'dashboard:showcase_ops_dashboard',
      label: 'Showcase Ops Dashboard',
      href: '/apps/showcase_app/dashboard/showcase_ops_dashboard',
      type: 'dashboard',
      visitedAt: '2026-10-06T09:00:00.000Z',
    },
    {
      id: 'object:showcase_task',
      label: 'Task',
      href: '/apps/showcase_app/showcase_task',
      type: 'object',
      visitedAt: '2026-10-06T08:59:00.000Z',
    },
    // A record and a Studio metadata item keep their text: neither has a
    // metadata label to resolve.
    {
      id: 'record:showcase_task:t1',
      label: 'Write the brief',
      href: '/apps/showcase_app/showcase_task/record/t1',
      type: 'record',
      visitedAt: '2026-10-06T08:58:00.000Z',
    },
    {
      id: 'metadata:object:sys_user',
      label: 'sys_user',
      href: '/apps/setup/metadata/object/sys_user',
      type: 'metadata',
      visitedAt: '2026-10-06T08:57:00.000Z',
    },
    // A host's own write whose id carries no `<type>:` names nothing to resolve.
    { id: 'my-page', label: 'Mine', href: '/x', type: 'page', visitedAt: '2026-10-06T08:56:00.000Z' },
  ];
  const READ: RecentItem[] = [
    {
      id: 'dashboard:showcase_ops_dashboard',
      type: 'dashboard',
      name: 'showcase_ops_dashboard',
      href: '/apps/showcase_app/dashboard/showcase_ops_dashboard',
      visitedAt: '2026-10-06T09:00:00.000Z',
    },
    {
      id: 'object:showcase_task',
      type: 'object',
      name: 'showcase_task',
      href: '/apps/showcase_app/showcase_task',
      visitedAt: '2026-10-06T08:59:00.000Z',
    },
    {
      id: 'record:showcase_task:t1',
      type: 'record',
      label: 'Write the brief',
      href: '/apps/showcase_app/showcase_task/record/t1',
      visitedAt: '2026-10-06T08:58:00.000Z',
    },
    {
      id: 'metadata:object:sys_user',
      type: 'metadata',
      label: 'sys_user',
      href: '/apps/setup/metadata/object/sys_user',
      visitedAt: '2026-10-06T08:57:00.000Z',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('from localStorage: the identity is read out of the id, the minted label is dropped', () => {
    localStorage.setItem('objectui-recent-items:u:user-1', JSON.stringify(LEGACY));
    const { result } = renderHook(() => useRecentItems(), { wrapper });
    expect(result.current.recentItems).toEqual(READ);
  });

  it('from the adapter: the same read, and reading it writes nothing back', async () => {
    const adapter = makeAdapter(LEGACY as unknown as RecentItem[]);
    const { result } = renderHook(() => useHarness(), { wrapper });
    act(() => result.current.attach('recent', adapter));
    await waitFor(() => expect(result.current.recent.recentItems).toEqual(READ));
    await new Promise(r => setTimeout(r, 700));
    expect(adapter.saveMock).not.toHaveBeenCalled();
  });

  it('the next change writes the identity shape, with no legacy label left in it', async () => {
    const adapter = makeAdapter(LEGACY as unknown as RecentItem[]);
    const { result } = renderHook(() => useHarness(), { wrapper });
    act(() => result.current.attach('recent', adapter));
    await waitFor(() => expect(result.current.recent.recentItems).toEqual(READ));
    act(() =>
      result.current.recent.addRecentItem({
        id: 'page:showcase_capability_map',
        type: 'page',
        name: 'showcase_capability_map',
        href: '/apps/showcase_app/page/showcase_capability_map',
      }),
    );
    await waitFor(() => expect(adapter.saveMock).toHaveBeenCalledTimes(1), { timeout: 1500 });
    const saved = adapter.saveMock.mock.calls[0][0] as RecentItem[];
    expect(saved.slice(1)).toEqual(READ);
    expect(JSON.stringify(saved)).not.toContain('Showcase Ops Dashboard');
  });
});
