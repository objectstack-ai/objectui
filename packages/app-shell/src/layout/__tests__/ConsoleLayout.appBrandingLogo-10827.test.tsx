// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * The console chrome draws the active app's `branding.logo` (objectui#10827).
 *
 * `branding.logo` is authored by the designer (`AppCreationWizard`,
 * `BrandingEditor`), documented, and set by downstream apps, and until this
 * card nothing mounted in the console rendered it: its only reader was the
 * never-mounted `AppSidebar`, removed by PR #10617. The mounted sidebar,
 * `UnifiedSidebar`, now reads it — the chrome's one reader — and draws it as a
 * header image. An app without a logo gets no header: today's sidebar, which
 * is the control.
 *
 * ## Real subjects
 *
 * `ConsoleLayout` with its real `AppShell` (`@object-ui/layout`) and real
 * `UnifiedSidebar`, under the real `NavigationProvider` — so the sidebar is in
 * `app` context only because `ConsoleLayout` put it there, as in the running
 * console. The stand-ins are the providers the sidebar reads (metadata,
 * permissions, auth, expressions) and the siblings this card does not touch:
 * the top bar (`AppHeader`), the chat dock and FAB, and the preview and
 * notification bars.
 *
 * The logo is read from `[data-sidebar="sidebar"]`, the sidebar's own root,
 * so no other surface can answer for it.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Partial mock: @object-ui/components also imports from @object-ui/i18n
// (createSafeTranslation), so the rest of the module must stay real.
vi.mock('@object-ui/i18n', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useObjectTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => String(options?.defaultValue ?? key),
    language: 'en',
  }),
  useObjectLabel: () => ({
    objectLabel: ({ label }: { label?: string }) => label,
    viewLabel: (_o: string, _v: string, fallback?: string) => fallback,
    dashboardLabel: ({ label }: { label?: string }) => label,
    appLabel: ({ name, label }: { name: string; label?: string }) => label || name,
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

// Lazy lucide DynamicIcon would suspend mid-test; a null icon is enough here.
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
vi.mock('../ContextSelectors', () => ({
  useAppContextSelectors: () => ({ contextValues: {}, element: null }),
  contextSelectorQueryKey: (id: string) => (id === 'active_package' ? 'package' : id),
  STUDIO_PACKAGE_SELECTOR_ID: 'active_package',
}));
vi.mock('../LocalizedSidebarTrigger', () => ({
  LocalizedSidebarTrigger: () => null,
}));

// Siblings in `ConsoleLayout` this card does not touch.
vi.mock('../AppHeader', () => ({ AppHeader: () => <div data-testid="app-header-stub" /> }));
vi.mock('../../hooks/useAiSurface', () => ({
  useAiSurfaceEnabled: () => ({ enabled: false, isLoading: false }),
}));
vi.mock('../ChatDock', () => ({
  useChatDockState: () => ({
    expanded: false,
    width: 420,
    dragging: false,
    maximized: false,
    toggle: vi.fn(),
    expand: vi.fn(),
    collapse: vi.fn(),
    maximize: vi.fn(),
    restore: vi.fn(),
    onResizePointerDown: vi.fn(),
  }),
  ChatDockPanel: () => null,
  ChatDockMobileSheet: () => null,
}));
vi.mock('../ConsoleChatbotFab', () => ({ ConsoleChatbotFab: () => null }));
vi.mock('../ConsoleNotificationBanners', () => ({ ConsoleNotificationBanners: () => null }));
vi.mock('../../preview/DraftPreviewBar', () => ({ DraftPreviewBar: () => null }));
vi.mock('../../preview/UnpublishedAppBar', () => ({ UnpublishedAppBar: () => null }));

import { SidebarProvider } from '@object-ui/components';
import { ConsoleLayout } from '../ConsoleLayout';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { NavigationProvider } from '../../context/NavigationContext';

const LOGO = 'https://cdn.example.test/acme-logo.svg';

const NAV = [{ id: 'n1', type: 'object', label: 'Accounts', objectName: 'account' }];

/** The two apps an author can have: one with `branding.logo`, one without. */
const BRANDED = { name: 'acme_crm', label: 'Acme CRM', active: true, branding: { primaryColor: '#2563eb', logo: LOGO }, navigation: NAV };
const PLAIN = { name: 'plain_app', label: 'Plain App', active: true, branding: { primaryColor: '#2563eb' }, navigation: NAV };

function mountConsole(activeApp: Record<string, unknown>, apps: Record<string, unknown>[] = [activeApp]) {
  metadataState = { apps, objects: [] };
  const name = String(activeApp.name);
  return render(
    <MemoryRouter initialEntries={[`/apps/${name}`]}>
      <NavigationProvider>
        <ConsoleLayout activeAppName={name} activeApp={activeApp} onAppChange={vi.fn()} objects={[]}>
          <div data-testid="route-content">page</div>
        </ConsoleLayout>
      </NavigationProvider>
    </MemoryRouter>,
  );
}

function sidebarRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>('[data-sidebar="sidebar"]');
  if (!root) throw new Error('the console chrome mounted no sidebar');
  return root;
}

const imagesIn = (el: HTMLElement) => [...el.querySelectorAll('img')].map((img) => img.getAttribute('src'));

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => cleanup());

describe('the console chrome renders the active app\'s `branding.logo` (objectui#10827)', () => {
  it('an app with `branding.logo` shows it at the top of the sidebar, named by the app\'s label', () => {
    const view = mountConsole(BRANDED);
    // The mount is real: the route content and the sidebar's navigation render.
    expect(view.getByTestId('route-content')).toBeInTheDocument();
    expect(view.getByText('Accounts')).toBeInTheDocument();

    const sidebar = sidebarRoot();
    expect(imagesIn(sidebar)).toEqual([LOGO]);
    expect(view.getByRole('img', { name: 'Acme CRM' })).toHaveAttribute('src', LOGO);
  });

  it('CONTROL — an app without a logo keeps today\'s sidebar: no image, same navigation', () => {
    const view = mountConsole(PLAIN);
    expect(view.getByText('Accounts')).toBeInTheDocument();
    expect(imagesIn(sidebarRoot())).toEqual([]);
  });

  it('the retired top-level `logo` renders nothing — only `branding.logo` is read', () => {
    const aliasOnly = { ...PLAIN, name: 'alias_app', logo: LOGO };
    const view = mountConsole(aliasOnly);
    expect(view.getByText('Accounts')).toBeInTheDocument();
    expect(imagesIn(sidebarRoot())).toEqual([]);
  });

  it('switching to a branded app shows ITS logo, not the first app\'s', () => {
    // `PLAIN` is listed first: the sidebar must follow the active app.
    mountConsole(BRANDED, [PLAIN, BRANDED]);
    expect(imagesIn(sidebarRoot())).toEqual([LOGO]);
    cleanup();
    mountConsole(PLAIN, [BRANDED, PLAIN]);
    expect(imagesIn(sidebarRoot())).toEqual([]);
  });
});

describe('outside an app, the sidebar draws no app logo (objectui#10827)', () => {
  it('home context, with a branded app first in the list, draws no image', () => {
    // No `ConsoleLayout`, so nothing moves the context off `home` — where the
    // sidebar's `activeApp` falls back to the FIRST app.
    metadataState = { apps: [BRANDED, PLAIN], objects: [] };
    render(
      <MemoryRouter initialEntries={['/home']}>
        <NavigationProvider>
          <SidebarHost />
        </NavigationProvider>
      </MemoryRouter>,
    );
    expect(imagesIn(sidebarRoot())).toEqual([]);
  });
});

/** The real sidebar in the real `SidebarProvider`, as `AppShell` mounts it. */
function SidebarHost() {
  return (
    <SidebarProvider>
      <UnifiedSidebar activeAppName="" />
    </SidebarProvider>
  );
}
