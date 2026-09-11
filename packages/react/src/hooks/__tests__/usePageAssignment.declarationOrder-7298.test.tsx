/**
 * ObjectUI — usePageAssignment: page assignment resolves by DECLARATION ORDER
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * objectui#7298 (half ①). `usePageAssignment` used to sort its candidates on a
 * `priority` key read off the page:
 *
 *     candidates.sort((a, b) => (b?.priority ?? 0) - (a?.priority ?? 0));
 *
 * `PageSchema` is a `strictObject` and does not declare `priority`, so no
 * author could ever set it — writing it is a hard parse error, and omitting it
 * left every candidate at `0`. The sort was decided by list position in every
 * reachable case, and the read documented an affordance the schema refuses.
 *
 * These pins assert WHICH PAGE is returned, not that the hook ran, so the
 * ordering rule is nailed down rather than implied — and the last block pins
 * the CONTRACT the removal rests on, so that if `priority` is ever declared
 * upstream (route A on that card) this file reds and points back here.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { PageSchema } from '@objectstack/spec/ui';
import { MetadataCtx } from '../../context/AppShellContext';
import { usePageAssignment } from '../usePageAssignment';

/** A metadata context carrying exactly the `pages` list under test. */
function wrapperFor(pages: any[]) {
  const ctx: any = {
    apps: [],
    objects: [],
    dashboards: [],
    reports: [],
    pages,
    loading: false,
    error: null,
    refresh: async () => {},
    invalidate: () => {},
    ensureType: async () => pages,
    getItem: async () => null,
    getItemsByType: () => [],
    getTypeStatus: () => 'ready' as const,
  };
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <MetadataCtx.Provider value={ctx}>{children}</MetadataCtx.Provider>;
  };
}

async function assign(pages: any[], objectName: string) {
  const { result } = renderHook(() => usePageAssignment(objectName), {
    wrapper: wrapperFor(pages),
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  return result;
}

/** An app-authored full record page. */
const full = (name: string, object: string, extra: Record<string, unknown> = {}) => ({
  name,
  label: name,
  type: 'record',
  object,
  ...extra,
});

/**
 * The platform's page, as `@objectstack/platform-objects` actually ships it:
 * `packages/platform-objects/src/pages/sys-user.page.ts` — `type: 'record'`,
 * `object: 'sys_user'`, `isDefault: true`, and `kind: 'slotted'`.
 */
const SYS_USER_DETAIL = {
  name: 'sys_user_detail',
  label: 'User',
  type: 'record',
  object: 'sys_user',
  template: 'default',
  kind: 'slotted',
  isDefault: true,
  regions: [],
  slots: { discussion: [] },
};

describe('usePageAssignment — selection is by declaration order', () => {
  it('returns the FIRST matching candidate, naming it', async () => {
    const result = await assign(
      [full('first_page', 'sys_user'), full('second_page', 'sys_user'), full('third_page', 'sys_user')],
      'sys_user',
    );
    expect(result.current.page?.name).toBe('first_page');
  });

  it('reversing the declaration order reverses the winner — position is the whole rule', async () => {
    const a = full('alpha', 'sys_user');
    const b = full('beta', 'sys_user');

    expect((await assign([a, b], 'sys_user')).current.page?.name).toBe('alpha');
    expect((await assign([b, a], 'sys_user')).current.page?.name).toBe('beta');
  });

  it('`isDefault` on a later candidate does NOT promote it', async () => {
    const result = await assign(
      [full('authored', 'sys_user'), full('marked_default', 'sys_user', { isDefault: true })],
      'sys_user',
    );
    // Declared and writable, but this decision never reads it: inert while
    // looking decisive. Pinned so a future reader does not mistake the flag
    // for the thing that picks the page.
    expect(result.current.page?.name).toBe('authored');
  });

  it('skips pages for other objects and other page types while ordering the rest', async () => {
    const result = await assign(
      [
        full('other_object', 'sys_organization'),
        { ...full('designer_page', 'sys_user'), pageType: 'record_detail' },
        full('the_winner', 'sys_user'),
        full('the_runner_up', 'sys_user'),
      ],
      'sys_user',
    );
    expect(result.current.page?.name).toBe('the_winner');
  });
});

describe('usePageAssignment — the collision every stock install has (objectui#7298)', () => {
  // `@objectstack/platform-objects` ships `sys_user_detail`, so ANY app that
  // authors its own `sys_user` record page has exactly two candidates.

  it('the app page wins when it is declared first', async () => {
    const result = await assign(
      [full('app_user_detail', 'sys_user'), SYS_USER_DETAIL],
      'sys_user',
    );
    expect(result.current.page?.name).toBe('app_user_detail');
    // The app page is `kind: 'full'`, so it populates `page`, never `slots`.
    expect(result.current.slots).toBeNull();
  });

  it('the platform page wins when IT is declared first — nothing authored breaks the tie', async () => {
    const result = await assign(
      [SYS_USER_DETAIL, full('app_user_detail', 'sys_user')],
      'sys_user',
    );
    // `sys_user_detail` is `kind: 'slotted'`, so the win shows up as populated
    // `slots` and a null `page` — an unmistakable discriminator between the two.
    expect(result.current.page).toBeNull();
    expect(result.current.slots).toEqual({ discussion: [] });
  });

  it('`isDefault: true` on the platform page does not make it win from second place', async () => {
    const result = await assign(
      [full('app_user_detail', 'sys_user'), SYS_USER_DETAIL],
      'sys_user',
    );
    expect(SYS_USER_DETAIL.isDefault).toBe(true);
    expect(result.current.page?.name).toBe('app_user_detail');
  });
});

describe('PageSchema refuses `priority` — the contract the removal rests on', () => {
  // Measured by PARSING, not by grepping: a bare grep for the key name
  // false-positives on `priority` appearing as a VALUE, and on the several
  // same-spelling keys of a DIFFERENT kind in this repo (validation rules,
  // hooks, action-handler registration, and a plain data field on business
  // objects). Parsing cannot be fooled by any of them.
  const base = { name: 'x_user_detail', label: 'User', type: 'record', object: 'sys_user' };

  it('is strict: a nonsense key is refused (negative control)', () => {
    const r = PageSchema.safeParse({ ...base, zzzNotAKey: 1 });
    expect(r.success).toBe(false);
    expect(r.error!.issues.some(i => i.code === 'unrecognized_keys')).toBe(true);
  });

  it('accepts the keys it DOES declare (positive control)', () => {
    // Without this leg the refusals below would also be produced by a schema
    // that rejects everything, and would say nothing about `priority`.
    expect(PageSchema.safeParse(base).success).toBe(true);
    expect(PageSchema.safeParse({ ...base, isDefault: true }).success).toBe(true);
    expect(PageSchema.safeParse({ ...base, icon: 'user' }).success).toBe(true);
  });

  it('refuses `priority` the same way it refuses a nonsense key — it is undeclared, not mistyped', () => {
    for (const value of [10, 0]) {
      const r = PageSchema.safeParse({ ...base, priority: value });
      expect(r.success).toBe(false);
      const unrecognized = r.error!.issues.filter(i => i.code === 'unrecognized_keys');
      expect(unrecognized).toHaveLength(1);
      expect((unrecognized[0] as any).keys).toEqual(['priority']);
    }
  });
});
