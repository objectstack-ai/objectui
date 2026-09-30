/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#9868 — an app navigation entry with NO `label` shows its target's
 * CURRENT label, on both surfaces that render an app's navigation, from the
 * metadata the shell already holds (the cloud#2021 letter-A ruling;
 * `@objectstack/spec` 17.5.0 made `label` optional with that semantic).
 *
 * The two surfaces are the sidebar's `NavigationRenderer` and the `nav:menu`
 * page block. Both are wired here exactly as the shell wires them — the same
 * `useNavTargetLabel` hook reading the same `MetadataCtx` — and every case
 * asserts both, so "the two surfaces agree" is a measurement, not a docstring.
 *
 * "Rename" is a new metadata value in the context (a new view `label` in the
 * `listViews` `MetadataProvider` merges into the object) with the SAME app and
 * the SAME navigation: nothing is written to the nav entry, and the new name
 * shows on the next render.
 */
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Module scope, never a `beforeAll` (AGENTS.md §测试纪律, objectui#3010).
import '@object-ui/components';
import { SidebarProvider } from '@object-ui/components';
import { SchemaRenderer, MetadataCtx } from '@object-ui/react';
import { NavigationRenderer } from '@object-ui/layout';
import '../nav-menu-renderer';
import { useNavTargetLabel } from '../../hooks/useNavTargetLabel';

const NAVIGATION = [
  // The subject: no label, names a view.
  { id: 'nav_board', type: 'object', objectName: 'customer', viewName: 'board' },
  // No label, names an object whose schema is labelled.
  { id: 'nav_orders', type: 'object', objectName: 'order' },
  // No label, names a dashboard.
  { id: 'nav_dash', type: 'dashboard', dashboardName: 'sales_overview' },
  // No label, names an object with NO label at all → machine-name backstop.
  { id: 'nav_bare', type: 'object', objectName: 'bare_thing' },
  // Controls: authored labels, one of them spelled like the machine name.
  { id: 'nav_accounts', type: 'object', objectName: 'account', label: 'account' },
  { id: 'nav_pipeline', type: 'object', objectName: 'customer', viewName: 'board', label: 'Pipeline' },
];

/** The metadata cache as `MetadataProvider` publishes it: views merged into `listViews`, keyed by `<object>.<key>`. */
function metadata(viewLabel: string) {
  return {
    apps: [{ name: 'crm', label: 'CRM', navigation: NAVIGATION }],
    objects: [
      {
        name: 'customer',
        label: 'Customers',
        listViews: { 'customer.board': { name: 'customer.board', label: viewLabel, type: 'kanban' } },
      },
      { name: 'order', label: { en: 'Orders', 'zh-CN': '订单' } },
      { name: 'account', label: 'Accounts' },
      { name: 'bare_thing' },
    ],
    dashboards: [{ name: 'sales_overview', label: 'Sales Overview' }],
    reports: [],
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

/** The sidebar surface, wired the way `UnifiedSidebar` wires it. */
function SidebarSurface() {
  const resolveTargetLabel = useNavTargetLabel();
  return (
    <SidebarProvider defaultOpen>
      <nav aria-label="Sidebar">
        <NavigationRenderer items={NAVIGATION as never} basePath="/apps/crm" resolveTargetLabel={resolveTargetLabel} />
      </nav>
    </SidebarProvider>
  );
}

function tree(value: ReturnType<typeof metadata>) {
  return (
    <MemoryRouter initialEntries={['/apps/crm']}>
      <MetadataCtx.Provider value={value as never}>
        <Routes>
          <Route
            path="/apps/:appName"
            element={
              <>
                <SidebarSurface />
                <SchemaRenderer
                  schema={{ type: 'page:section', id: 's1', children: [{ type: 'nav:menu', id: 'blk_nav' }] } as never}
                />
              </>
            }
          />
        </Routes>
      </MetadataCtx.Provider>
    </MemoryRouter>
  );
}

const surfaces = () => [
  screen.getByRole('navigation', { name: 'Sidebar' }),
  screen.getByRole('navigation', { name: 'App navigation' }),
];

describe('objectui#9868 — an unlabelled nav entry shows its target’s current label, on both surfaces', () => {
  it('shows the view’s label, then the renamed one on the next render — nav unchanged, nothing stored', () => {
    const utils = render(tree(metadata('客户管理仪表盘')));

    for (const surface of surfaces()) {
      const link = within(surface).getByRole('link', { name: '客户管理仪表盘' });
      expect(link).toHaveAttribute('href', '/apps/crm/customer/view/board');
    }

    utils.rerender(tree(metadata('Customer Board')));

    for (const surface of surfaces()) {
      expect(within(surface).getByRole('link', { name: 'Customer Board' })).toHaveAttribute(
        'href',
        '/apps/crm/customer/view/board',
      );
      expect(within(surface).queryByText('客户管理仪表盘')).toBeNull();
    }
    // Nothing was written back into the navigation.
    expect(NAVIGATION[0]).not.toHaveProperty('label');
  });

  it('inherits the object’s and the dashboard’s label (an inline locale map resolves in the active language)', () => {
    render(tree(metadata('Board')));
    for (const surface of surfaces()) {
      expect(within(surface).getByRole('link', { name: 'Orders' })).toHaveAttribute('href', '/apps/crm/order');
      expect(within(surface).getByRole('link', { name: 'Sales Overview' })).toBeInTheDocument();
    }
  });

  it('renders the machine name when the target has no label at all', () => {
    render(tree(metadata('Board')));
    for (const surface of surfaces()) {
      expect(within(surface).getByRole('link', { name: 'bare_thing' })).toHaveAttribute('href', '/apps/crm/bare_thing');
    }
  });

  it('control: an authored label renders verbatim, even one equal to the machine name', () => {
    render(tree(metadata('Board')));
    for (const surface of surfaces()) {
      // 'account' is NOT replaced by the object's 'Accounts' (route B refused)…
      expect(within(surface).getByRole('link', { name: 'account' })).toHaveAttribute('href', '/apps/crm/account');
      expect(within(surface).queryByText('Accounts')).toBeNull();
      // …and 'Pipeline' is NOT replaced by the view's 'Board' it also names.
      expect(within(surface).getByRole('link', { name: 'Pipeline' })).toBeInTheDocument();
    }
  });
});
