// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#12602 — what `useHomeInbox` hands Home's "My work" section beyond
 * the counts, over the real shared store and a stubbed `fetch`:
 *
 *   - the approval requests themselves, from the ONE approvals read the bell
 *     badges: one entry per distinct request id, so the count stays the
 *     list's length, and the service's display labels copied as served;
 *   - whether each source is the caller's to read. The inbox follows the
 *     predicate the activity feed applies to `sys_activity` (objectui#12081):
 *     `false` only when the LOADED permissions refuse read on
 *     `sys_inbox_message`, unknown permissions read `true`. The approvals
 *     endpoint answers every signed-in user about their own requests, so it is
 *     `false` only with nobody signed in.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const auth = vi.hoisted(() => ({ user: { id: 'u1', email: 'u1@example.com' } as { id: string; email: string } | null }));
const perms = vi.hoisted(() => ({ isLoaded: false, refused: new Set<string>() }));

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ user: auth.user }),
}));
vi.mock('@object-ui/permissions', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  usePermissions: () => ({
    isLoaded: perms.isLoaded,
    can: (object: string) => !perms.refused.has(object),
  }),
}));
vi.mock('../../providers/AdapterProvider', () => ({ useAdapter: () => null }));
vi.mock('../../utils/authToken', () => ({ bearerAuthHeaders: () => ({}) }));

import { useHomeInbox } from '../useHomeInbox';
import { __resetSharedUserFeeds } from '../sharedUserFeeds';

let rows: Array<Record<string, unknown>> = [];

const settle = async () => {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
};

beforeEach(() => {
  auth.user = { id: 'u1', email: 'u1@example.com' };
  perms.isLoaded = false;
  perms.refused = new Set();
  rows = [];
  __resetSharedUserFeeds();
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        String(url).includes('/api/v1/approvals/requests')
          ? new Response(JSON.stringify({ data: rows }), { status: 200 })
          : new Response('{}', { status: 404 }),
      ),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  __resetSharedUserFeeds();
});

describe('the approval requests behind the count (objectui#12602)', () => {
  it('lists the requests, one per id, and counts exactly those', async () => {
    rows = [
      { id: 'a1', process_name: 'discount', process_label: 'Discount approval', record_title: 'QUO-0007', created_at: '2026-10-16T01:00:00Z' },
      { id: 'a1', process_name: 'discount', process_label: 'Discount approval', record_title: 'QUO-0007' },
      { id: 'a2', process_name: 'contract' },
    ];
    const { result } = renderHook(() => useHomeInbox());
    await settle();
    expect(result.current.pendingApprovalsStatus).toBe('ready');
    expect(result.current.pendingApprovalsCount).toBe(2);
    expect(result.current.pendingApprovals).toEqual([
      { id: 'a1', processName: 'discount', processLabel: 'Discount approval', recordTitle: 'QUO-0007', createdAt: '2026-10-16T01:00:00Z' },
      { id: 'a2', processName: 'contract', processLabel: undefined, recordTitle: undefined, createdAt: undefined },
    ]);
  });

  it('caps the preview at the limit while the count stays the whole list', async () => {
    rows = Array.from({ length: 7 }, (_, i) => ({ id: `a${i}`, process_name: 'p' }));
    const { result } = renderHook(() => useHomeInbox(3));
    await settle();
    expect(result.current.pendingApprovalsCount).toBe(7);
    expect(result.current.pendingApprovals.map((r) => r.id)).toEqual(['a0', 'a1', 'a2']);
  });
});

describe('which sources the caller may read (objectui#12602)', () => {
  it('reads both while permissions are not loaded — unknown is not a refusal', () => {
    const { result } = renderHook(() => useHomeInbox());
    expect(result.current.notificationsReadable).toBe(true);
    expect(result.current.pendingApprovalsReadable).toBe(true);
  });

  it('refuses the inbox when the loaded permissions refuse sys_inbox_message', () => {
    perms.isLoaded = true;
    perms.refused = new Set(['sys_inbox_message']);
    const { result } = renderHook(() => useHomeInbox());
    expect(result.current.notificationsReadable).toBe(false);
    expect(result.current.pendingApprovalsReadable).toBe(true);
  });

  it('CONTROL: a loaded grant reads the inbox', () => {
    perms.isLoaded = true;
    const { result } = renderHook(() => useHomeInbox());
    expect(result.current.notificationsReadable).toBe(true);
  });

  it('has no approvals inbox to read with nobody signed in', () => {
    auth.user = null;
    const { result } = renderHook(() => useHomeInbox());
    expect(result.current.pendingApprovalsReadable).toBe(false);
  });
});
