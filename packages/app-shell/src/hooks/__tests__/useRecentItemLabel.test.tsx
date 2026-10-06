/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `useRecentItemLabel` — each kind of recent entry is labelled by the resolver
 * the console already has for that kind, and nothing is minted (objectui#11678).
 *
 * The dashboard / page / zh-CN roads are pinned through the real Home cards in
 * `console/home/__tests__/RecentApps.labelAtRender-11678.test.tsx`; this file
 * covers the kinds Home does not list (a report) and the two kinds that carry
 * their own text.
 */

import { describe, it, expect } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { MetadataCtx } from '@object-ui/react';
import { createI18n, I18nProvider } from '@object-ui/i18n';
import { useRecentItemLabel } from '../useRecentItemLabel';
import type { RecentItem } from '../../context/RecentItemsProvider';

function metadata() {
  return {
    apps: [],
    objects: [{ name: 'showcase_task', label: 'Tasks' }],
    dashboards: [],
    reports: [{ name: 'q3_results', label: 'Q3 Results' }],
    pages: [],
    loading: false,
    error: null,
    refresh: async () => {},
    invalidate: () => {},
    ensureType: async () => [],
    getItem: async () => null,
    getItemsByType: () => [],
    getTypeStatus: () => 'ready' as const,
  };
}

function wrapper(language: string) {
  const i18n = createI18n({
    defaultLanguage: language,
    detectBrowserLanguage: false,
    resources: { 'zh-CN': { showcase: { reports: { q3_results: { label: '第三季度结果' } } } } },
  });
  return ({ children }: { children: ReactNode }) => (
    <I18nProvider instance={i18n} persistLanguage={false}>
      <MetadataCtx.Provider value={metadata() as never}>{children}</MetadataCtx.Provider>
    </I18nProvider>
  );
}

const at = '2026-10-06T09:00:00.000Z';
const REPORT: RecentItem = { id: 'report:q3_results', type: 'report', name: 'q3_results', href: '/r', visitedAt: at };

describe('useRecentItemLabel (objectui#11678)', () => {
  it('a report: its metadata label in en, its bundle label in zh-CN', () => {
    const en = renderHook(() => useRecentItemLabel(), { wrapper: wrapper('en') });
    expect(en.result.current(REPORT)).toBe('Q3 Results');
    const zh = renderHook(() => useRecentItemLabel(), { wrapper: wrapper('zh-CN') });
    expect(zh.result.current(REPORT)).toBe('第三季度结果');
  });

  it('an object: its current metadata label', () => {
    const { result } = renderHook(() => useRecentItemLabel(), { wrapper: wrapper('en') });
    expect(
      result.current({ id: 'object:showcase_task', type: 'object', name: 'showcase_task', href: '/o', visitedAt: at }),
    ).toBe('Tasks');
  });

  it('an item with no metadata label shows its machine name — never a titleized one', () => {
    const { result } = renderHook(() => useRecentItemLabel(), { wrapper: wrapper('en') });
    expect(
      result.current({ id: 'page:welcome_tour', type: 'page', name: 'welcome_tour', href: '/p', visitedAt: at }),
    ).toBe('welcome_tour');
  });

  it('a record and a Studio metadata item show the text they carry', () => {
    const { result } = renderHook(() => useRecentItemLabel(), { wrapper: wrapper('zh-CN') });
    expect(
      result.current({ id: 'record:showcase_task:t1', type: 'record', label: 'Write the brief', href: '/x', visitedAt: at }),
    ).toBe('Write the brief');
    expect(
      result.current({ id: 'metadata:object:sys_user', type: 'metadata', label: 'sys_user', href: '/m', visitedAt: at }),
    ).toBe('sys_user');
  });
});
