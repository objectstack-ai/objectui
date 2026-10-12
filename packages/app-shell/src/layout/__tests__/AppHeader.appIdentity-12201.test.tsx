// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * The top bar inside an app starts with the app (objectui#12201, maintainer
 * ruling of 2026-10-12, items 4, 5 and 6).
 *
 * - Item 4: the platform mark leaves the bar in app context — the bar starts
 *   with the app pill, and no path separator precedes it. Platform surfaces
 *   (`home`, `orgs`, `studio` variants) keep the mark.
 * - Item 5: the PREVIEW stage chip sits on the right, beside the search box,
 *   inside an app; on platform surfaces it stays beside the mark.
 * - Item 6: the Studio entry is a labelled outline button 「Edit app」 with a
 *   pencil, at the left edge of the right-hand utility cluster: the label from
 *   `lg` up, the pencil alone with a tooltip below that. The app pill's
 *   dropdown row takes the button's own target. A member sees neither.
 *
 * Real subject: `AppHeader`, under the real `MePermissionsProvider` seeded
 * with each persona's `/me/permissions` payload — the harness of
 * `AppHeader.designInStudioNeedsAuthoring-10899.test.tsx`. The pill and the
 * stage chip are recorders that keep what the header hands them; their own
 * rendering is `AppSwitcher.appIdentity-12201.test.tsx`'s and
 * `PreviewBadge.test.tsx`'s. Layout is not measured here — the responsive
 * classes and the tooltip are what the header controls, so they are what is
 * asserted.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MePermissionsProvider, type MePermissionsResponse } from '@object-ui/permissions';

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/apps/cloud_control/page/welcome', search: '', hash: '', state: null, key: 't' }),
  useParams: () => ({}),
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()] as const,
  Link: ({ children, to, ...p }: Record<string, unknown> & { children?: React.ReactNode }) => (
    <a href={String(to)} {...p}>{children}</a>
  ),
}));

vi.mock('@object-ui/i18n', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useObjectTranslation: () => ({
    language: 'en',
    t: (key: string, options?: Record<string, unknown>) => String(options?.defaultValue ?? key),
  }),
  useObjectLabel: () => {
    const label = (x: { name?: string; label?: string } | string) =>
      typeof x === 'string' ? x : String(x?.label ?? x?.name ?? '');
    return {
      objectLabel: label,
      objectPluralLabel: label,
      dashboardLabel: label,
      pageLabel: label,
      reportLabel: label,
      viewLabel: (_o: string, _v: string, fallback?: string) => fallback ?? '',
      appLabel: label,
    };
  },
}));

vi.mock('@object-ui/components', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  type Props = Record<string, unknown> & { children?: React.ReactNode };
  const Pass = ({ children, asChild: _a, variant: _v, size: _s, align: _al, sideOffset: _so, ...rest }: Props) => (
    <div {...rest}>{children}</div>
  );
  return {
    ...actual,
    Button: ({ children, asChild, variant, size, ...p }: Props) =>
      asChild ? (
        <span data-variant={variant} data-size={size} {...p}>{children}</span>
      ) : (
        <button type="button" data-variant={variant} {...p}>{children}</button>
      ),
    DropdownMenu: Pass,
    DropdownMenuTrigger: Pass,
    DropdownMenuContent: () => null,
    DropdownMenuItem: Pass,
    DropdownMenuLabel: Pass,
    DropdownMenuSeparator: () => null,
    DropdownMenuGroup: Pass,
    Avatar: Pass,
    AvatarImage: () => null,
    AvatarFallback: Pass,
    Popover: Pass,
    PopoverTrigger: Pass,
    PopoverContent: () => null,
  };
});

vi.mock('lucide-react', () => {
  const Icon = () => <span />;
  return new Proxy({ __esModule: true } as Record<string | symbol, unknown>, {
    get: (target, prop) => {
      if (prop === 'then' || prop === '__esModule' || typeof prop === 'symbol') return target[prop];
      return Icon;
    },
    has: (_target, prop) => prop !== 'then',
  });
});

vi.mock('@object-ui/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useOffline: () => ({ isOnline: true }),
}));

vi.mock('@object-ui/collaboration', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  PresenceAvatars: () => null,
  useTenantPresence: () => [],
}));

vi.mock('../ModeToggle', () => ({ ModeToggle: () => null }));
vi.mock('../WorkspaceSwitcher', () => ({ WorkspaceSwitcher: () => null }));
vi.mock('../CurrentOrganizationIndicator', () => ({ CurrentOrganizationIndicator: () => null }));
vi.mock('../LocaleSwitcher', () => ({ LocaleSwitcher: () => null }));
vi.mock('../ConnectionStatus', () => ({ ConnectionStatus: () => null }));
vi.mock('../LocalizedSidebarTrigger', () => ({ LocalizedSidebarTrigger: () => null }));
vi.mock('../InboxPopover', () => ({ InboxPopover: () => <span data-testid="inbox-stub" /> }));
vi.mock('../../hooks/useAiSurface', () => ({
  useAiSurfaceEnabled: () => ({ enabled: false, isLoading: false }),
}));
// Recorders: what the header hands the pill and the stage chip.
vi.mock('../AppSwitcher', () => ({
  AppSwitcher: (p: { activeAppName: string; designInStudioPath?: string | null }) => (
    <div data-testid="app-switcher-stub" data-active={p.activeAppName} data-studio-path={p.designInStudioPath ?? ''} />
  ),
}));
vi.mock('../PreviewBadge', () => ({
  PreviewBadge: ({ className }: { className?: string }) => <span data-testid="preview-badge-stub" className={className} />,
}));

const viewer = vi.hoisted(() => ({ isAdmin: true }));
vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({
    user: { id: 'u1', name: 'Lin Yue', email: 'linyue@example.com' },
    signOut: vi.fn(),
    isAuthEnabled: true,
    organizations: [],
    activeOrganization: null,
    isOrganizationsLoading: false,
    getAuthConfig: undefined,
  }),
  getUserInitials: () => 'LY',
  useWorkspaceAdminStatus: () => ({ isAdmin: viewer.isAdmin, isResolved: true }),
}));

// An app owned by a package — so the bridge has a target.
vi.mock('../../providers/MetadataProvider', () => ({
  useMetadata: () => ({
    apps: [{ name: 'cloud_control', label: 'Cloud', _packageId: 'com.objectstack.cloud' }],
    dashboards: [],
    pages: [{ name: 'welcome', label: 'Welcome' }],
    reports: [],
  }),
}));

vi.mock('../../providers/AdapterProvider', () => ({
  useAdapter: () => ({ find: () => Promise.resolve({ data: [] }), getClient: () => undefined }),
}));

import { AppHeader } from '../AppHeader';
import { CommandPaletteProvider } from '../../context/CommandPaletteProvider';
import { getProductName } from '../../runtime-config';

function mePermissions(systemPermissions: string[]): MePermissionsResponse {
  return {
    authenticated: true,
    userId: 'u1',
    tenantId: 'org_1',
    roles: [],
    permissionSets: [],
    systemPermissions,
    objects: {},
    fields: {},
  };
}

/** A metadata author: holds `manage_metadata`. */
const AUTHOR = mePermissions(['manage_metadata', 'studio.access', 'setup.access']);

function mountApp(perms: MePermissionsResponse = AUTHOR) {
  return render(
    <MePermissionsProvider initialPermissions={perms}>
      <CommandPaletteProvider>
        <AppHeader variant="app" appName="Cloud" activeAppName="cloud_control" onAppChange={vi.fn()} objects={[]} />
      </CommandPaletteProvider>
    </MePermissionsProvider>,
  );
}

function mountHome() {
  return render(
    <MePermissionsProvider initialPermissions={AUTHOR}>
      <AppHeader variant="home" />
    </MePermissionsProvider>,
  );
}

const follows = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

beforeEach(() => {
  viewer.isAdmin = true;
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ data: [] }) })));
});

describe('inside an app the bar starts with the app pill (objectui#12201 item 4)', () => {
  it('no platform mark in app context', () => {
    mountApp();
    expect(screen.getByTestId('app-switcher-stub')).toBeInTheDocument();
    expect(screen.queryByTitle(getProductName())).not.toBeInTheDocument();
  });

  it('no path separator precedes the pill — the separators belong to the crumbs after it', () => {
    mountApp();
    const pill = screen.getByTestId('app-switcher-stub');
    const separators = [...document.querySelectorAll('span[aria-hidden]')].filter((s) => s.textContent?.trim() === '/');
    // `/apps/cloud_control/page/welcome` — one crumb, Welcome: a page route
    // carries no 「Pages」 type crumb (objectui#12198).
    expect(separators).toHaveLength(1);
    for (const sep of separators) expect(follows(pill, sep)).toBe(true);
  });

  it('CONTROL — a platform surface (Home) keeps the mark, linked to Home', () => {
    mountHome();
    expect(screen.getByTitle(getProductName()).closest('a')).toHaveAttribute('href', '/home');
    expect(screen.queryByTestId('app-switcher-stub')).not.toBeInTheDocument();
  });
});

describe('the PREVIEW chip moves beside the search box inside an app (objectui#12201 item 5)', () => {
  it('app context: in the right-hand cluster, immediately before the search group', () => {
    mountApp();
    const badges = screen.getAllByTestId('preview-badge-stub');
    expect(badges).toHaveLength(1);
    const search = screen.getByTestId('action:command-palette:open');
    expect(badges[0].nextElementSibling).toContainElement(search);
  });

  it('CONTROL — a platform surface keeps it in the brand zone, after the mark', () => {
    mountHome();
    const badges = screen.getAllByTestId('preview-badge-stub');
    expect(badges).toHaveLength(1);
    const mark = screen.getByTitle(getProductName()).closest('a')!;
    expect(badges[0].parentElement).toBe(mark.parentElement);
    expect(follows(mark, badges[0])).toBe(true);
  });
});

describe('the Studio entry is a labelled 「Edit app」 button (objectui#12201 item 6)', () => {
  it('an outline button with a pencil, labelled from `lg` up, pencil-only with a tooltip below', () => {
    mountApp();
    const bridge = screen.getByTestId('app-design-in-studio-button');
    expect(bridge).toHaveAttribute('data-variant', 'outline');
    const label = screen.getByTestId('app-design-in-studio-label');
    expect(label).toHaveTextContent('Edit app');
    expect(label.className.split(' ')).toEqual(expect.arrayContaining(['hidden', 'lg:inline']));
    // Narrow widths: a square pencil button, named and tooltipped by the label.
    expect(bridge.className.split(' ')).toEqual(expect.arrayContaining(['w-8', 'lg:w-auto']));
    expect(bridge).toHaveAttribute('aria-label', 'Edit app');
    expect(bridge).toHaveAttribute('title', 'Edit app');
  });

  it('sits at the left edge of the right-hand utility cluster, before the bell', () => {
    mountApp();
    const bridge = screen.getByTestId('app-design-in-studio-button');
    const group = bridge.parentElement!;
    expect(group).toHaveAttribute('data-topbar-group');
    expect(group.firstElementChild).toBe(bridge);
    expect(follows(bridge, screen.getByTestId('inbox-stub'))).toBe(true);
  });

  it('the pill\'s Studio row gets the button\'s very target — same gate, same deep link', () => {
    mountApp();
    const href = screen.getByTestId('app-design-in-studio-button').querySelector('a')!.getAttribute('href');
    expect(href).toContain('/studio/com.objectstack.cloud/');
    expect(screen.getByTestId('app-switcher-stub')).toHaveAttribute('data-studio-path', href!);
  });

  it('a member sees neither the button nor the pill\'s Studio row', () => {
    viewer.isAdmin = false;
    mountApp();
    expect(screen.queryByTestId('app-design-in-studio-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('app-switcher-stub')).toHaveAttribute('data-studio-path', '');
  });
});
