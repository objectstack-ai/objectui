// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * UnifiedSidebar — an app navigation entry with NO `label` shows its target's
 * CURRENT label from the metadata cache (objectui#9868, the cloud#2021
 * letter-A ruling).
 *
 * This pins the WIRING in the real sidebar: `UnifiedSidebar` hands
 * `NavigationRenderer` the `useNavTargetLabel` resolver, which reads the
 * object schemas `useMetadata()` publishes. The rename case re-renders the same
 * navigation over a new metadata value and expects the new name — nothing is
 * stored on the nav entry.
 *
 * Harness: the provider / chrome mocks of
 * `UnifiedSidebar.derivedAreaVisibility.test.tsx`; `@object-ui/layout` and
 * `@object-ui/components` stay REAL.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { NavigationItem } from '@object-ui/types';

vi.mock('@object-ui/i18n', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useObjectTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => String(options?.defaultValue ?? key),
    language: 'en',
  }),
  // No translation bundle: every convention lookup answers its fallback.
  useObjectLabel: () => ({
    objectLabel: ({ label }: { label?: string }) => label,
    viewLabel: (_o: string, _v: string, fallback?: string) => fallback,
    dashboardLabel: ({ label }: { label?: string }) => label,
    appLabel: ({ label }: { label?: string }) => label,
  }),
}));

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ user: null, activeOrganization: null }),
  useWorkspaceAdminStatus: () => ({ isAdmin: false, isResolved: true }),
}));

vi.mock('@object-ui/permissions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@object-ui/permissions')>()),
  usePermissions: () => ({ can: () => true, hasCapabilities: () => true }),
}));

let metadataState: { apps: unknown[]; objects: unknown[] };
vi.mock('../../providers/MetadataProvider', () => ({
  useMetadata: () => metadataState,
}));

vi.mock('../../providers/ExpressionProvider', () => ({
  useExpressionContext: () => ({ evaluator: null }),
  evaluateVisibility: (expr: unknown) => expr !== false && expr !== 'false',
}));

vi.mock('../../utils', () => ({
  resolveKeyedI18nLabel: (label: unknown) => (typeof label === 'string' ? label : ''),
  matchAppBySegment: (apps: Array<{ name?: string }>, segment?: string) =>
    apps.find((a) => a?.name === segment),
  appRouteSegment: (app: { name?: string }) => app?.name,
}));

vi.mock('../../utils/getIcon', () => ({ getIcon: () => () => null }));
vi.mock('../../hooks/useRecentItems', () => ({ useRecentItems: () => ({ recentItems: [] }) }));
vi.mock('../../hooks/useFavorites', () => ({
  useFavorites: () => ({ favorites: [], removeFavorite: vi.fn() }),
}));
vi.mock('../../hooks/useNavPins', () => ({
  useNavPins: () => ({ togglePin: vi.fn(), applyPins: (items: unknown) => items }),
}));
vi.mock('../../hooks/useNavActionDispatch', () => ({
  useNavActionDispatch: () => vi.fn(),
}));
vi.mock('../../context/NavigationContext', () => ({
  useNavigationContext: () => ({ context: 'app', currentAppName: 'crm' }),
}));
vi.mock('../ContextSelectors', () => ({
  useAppContextSelectors: () => ({ contextValues: {}, element: null }),
  contextSelectorQueryKey: (id: string) => (id === 'active_package' ? 'package' : id),
  STUDIO_PACKAGE_SELECTOR_ID: 'active_package',
}));
vi.mock('../LocalizedSidebarTrigger', () => ({
  LocalizedSidebarTrigger: () => null,
}));

import { SidebarProvider } from '@object-ui/components';
import { UnifiedSidebar } from '../UnifiedSidebar';

const navigation: NavigationItem[] = [
  { id: 'nav_board', type: 'object', objectName: 'customer', viewName: 'board' },
  { id: 'nav_accounts', type: 'object', objectName: 'account', label: 'account' },
];

function sidebarUi(viewLabel: string) {
  metadataState = {
    apps: [{ name: 'crm', label: 'CRM', active: true, navigation }],
    objects: [
      {
        name: 'customer',
        label: 'Customers',
        listViews: { 'customer.board': { name: 'customer.board', label: viewLabel } },
      },
      { name: 'account', label: 'Accounts' },
    ],
  };
  return (
    <MemoryRouter initialEntries={['/apps/crm']}>
      <SidebarProvider>
        <UnifiedSidebar activeAppName="crm" />
      </SidebarProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('UnifiedSidebar — an unlabelled entry inherits its target’s label (objectui#9868)', () => {
  it('shows the view’s label, and the renamed one on the next render', () => {
    const { rerender } = render(sidebarUi('客户管理仪表盘'));
    expect(screen.getByRole('link', { name: '客户管理仪表盘' })).toHaveAttribute(
      'href',
      '/apps/crm/customer/view/board',
    );

    rerender(sidebarUi('Customer Board'));
    expect(screen.getByRole('link', { name: 'Customer Board' })).toBeInTheDocument();
    expect(screen.queryByText('客户管理仪表盘')).not.toBeInTheDocument();
    expect(navigation[0]).not.toHaveProperty('label');
  });

  it('control: an authored label equal to the machine name stays verbatim', () => {
    render(sidebarUi('Board'));
    expect(screen.getByRole('link', { name: 'account' })).toHaveAttribute('href', '/apps/crm/account');
    expect(screen.queryByText('Accounts')).not.toBeInTheDocument();
  });
});
