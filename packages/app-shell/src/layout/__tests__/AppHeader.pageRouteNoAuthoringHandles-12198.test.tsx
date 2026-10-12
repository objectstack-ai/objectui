// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * A user page carries no 「Pages」 crumb and, for a caller who may not author
 * metadata, no authoring handle (objectui#12198, executing the maintainer's
 * ruling on objectstack-ai/cloud#2768).
 *
 * - The crumb: a page route's trail goes from the app pill straight to the
 *   page. The 「Pages」 crumb named a metadata type, not a place the user went,
 *   and linked only to the app's base; it is gone, and its pack key with it.
 * - The handles: a page route offers three Studio entries — the page's pencil
 *   (`PageView`), the top bar's 「Edit app」 button and the app pill's
 *   「Edit APP in Studio」 row (`AppHeader`, `AppSwitcher`). A caller without
 *   `manage_metadata` sees none of them: the organization owner (a workspace
 *   admin whose framework `organization_admin` set withholds the capability,
 *   ADR-0066) and a plain member. The CONTROL is a workspace admin holding
 *   `manage_metadata`, who sees all three in the same tree.
 *
 * The personas differ by the `/me/permissions` payload the real
 * `MePermissionsProvider` is seeded with — the capability, ⛔ not a role name.
 * The workspace-admin flag is the stubbed axis, as in the objectui#10899 pins
 * (`AppHeader.designInStudioNeedsAuthoring-10899`,
 * `PageView.editInStudioNeedsAuthoring-10899`), which pin each surface's gate
 * on its own; this file pins the three together, for one session, on one
 * route.
 *
 * Real subjects: `AppHeader` in its `app` variant with the real `AppSwitcher`
 * — its menu content passed through so the Studio row renders without radix's
 * open/close machinery — and `PageView`, side by side under one provider. The
 * chrome this card does not touch is stubbed the way the objectui#10899 pins
 * stub it.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MePermissionsProvider, type MePermissionsResponse } from '@object-ui/permissions';

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/apps/cloud_control/page/welcome', search: '', hash: '', state: null, key: 't' }),
  useParams: () => ({ pageName: 'welcome' }),
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
    t: (key: string, options?: Record<string, unknown>) =>
      String(options?.defaultValue ?? key).replace('{{app}}', String(options?.app ?? '')),
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
  const strip = (p: Record<string, unknown> | undefined) => {
    const { asChild: _a, variant: _v, size: _s, align: _al, sideOffset: _so, ...rest } = p ?? {};
    return rest;
  };
  const Pass = ({ children, ...p }: Record<string, unknown> & { children?: React.ReactNode }) => (
    <div {...strip(p)}>{children}</div>
  );
  return {
    ...actual,
    Button: ({ children, asChild, variant: _v, size: _s, ...p }: Record<string, unknown> & { children?: React.ReactNode }) =>
      asChild ? <span {...p}>{children}</span> : <button type="button" {...p}>{children}</button>,
    DropdownMenu: Pass,
    DropdownMenuTrigger: Pass,
    // Passed through, unlike the objectui#10899 harness: the app pill's Studio
    // row lives in its menu content.
    DropdownMenuContent: Pass,
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
    cn: (...c: unknown[]) => c.filter(Boolean).join(' '),
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

// `getIcon` wraps lucide's per-icon dynamic import; the pill's glyph is not
// under test, so no unbounded module load races the assertions.
vi.mock('../../utils/getIcon', () => ({
  getIcon: () => () => <svg />,
}));

// The page body is not under test — only the chrome around it.
vi.mock('@object-ui/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useOffline: () => ({ isOnline: true }),
  useAdapter: () => ({}),
  SchemaRenderer: () => <div data-testid="page-body" />,
}));

vi.mock('@object-ui/collaboration', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  PresenceAvatars: () => null,
  useTenantPresence: () => [],
}));

vi.mock('../ModeToggle', () => ({ ModeToggle: () => null }));
vi.mock('../WorkspaceSwitcher', () => ({ WorkspaceSwitcher: () => null }));
vi.mock('../LocaleSwitcher', () => ({ LocaleSwitcher: () => null }));
vi.mock('../ConnectionStatus', () => ({ ConnectionStatus: () => null }));
vi.mock('../LocalizedSidebarTrigger', () => ({ LocalizedSidebarTrigger: () => null }));
vi.mock('../PreviewBadge', () => ({ PreviewBadge: () => null }));
vi.mock('../InboxPopover', () => ({ InboxPopover: () => null }));
vi.mock('../../hooks/useAiSurface', () => ({
  useAiSurfaceEnabled: () => ({ enabled: false, isLoading: false }),
}));
vi.mock('../../views/MetadataInspector', () => ({
  MetadataPanel: () => null,
  useMetadataInspector: () => ({ showDebug: false }),
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

// The control plane's own app, owned by a package — so the Studio bridge has
// a target — and its `welcome` page.
vi.mock('../../providers/MetadataProvider', () => ({
  useMetadata: () => ({
    apps: [{ name: 'cloud_control', label: 'Cloud', _packageId: 'com.objectstack.cloud' }],
    dashboards: [],
    pages: [{ name: 'welcome', type: 'page', label: 'Welcome' }],
    reports: [],
    objects: [],
  }),
}));

vi.mock('../../providers/AdapterProvider', () => ({
  useAdapter: () => ({ find: () => Promise.resolve({ data: [] }), getClient: () => undefined }),
}));

import { AppHeader } from '../AppHeader';
import { PageView } from '../../views/PageView';

/** `/me/permissions` for a persona, with the fields these surfaces do not read left empty. */
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

/** framework `organization_admin` — what a signed-up organization owner holds. */
const ORG_OWNER = mePermissions(['manage_org_users', 'setup.access', 'setup.write']);
/** framework `member_default` declares no system permission. */
const MEMBER = mePermissions([]);
/** A metadata author: holds `manage_metadata`. */
const AUTHOR = mePermissions(['manage_metadata', 'studio.access', 'setup.access']);

const HANDLES = ['page-edit-in-studio-button', 'app-design-in-studio-button', 'app-switcher-edit-in-studio'] as const;

async function mountPageRoute(perms: MePermissionsResponse) {
  render(
    <MePermissionsProvider initialPermissions={perms}>
      <AppHeader variant="app" appName="Cloud" activeAppName="cloud_control" onAppChange={vi.fn()} objects={[]} />
      <PageView />
    </MePermissionsProvider>,
  );
  // Both halves rendered, and the pill's menu content with them — so an absent
  // handle below is a reading, not a harness that drew nothing.
  expect(await screen.findByTestId('page-body')).toBeInTheDocument();
  expect(screen.getByTestId('app-switcher-trigger')).toBeInTheDocument();
  expect(screen.getByTestId('app-switcher-all-apps')).toBeInTheDocument();
}

/** The crumbs after the app pill, in order: each separator's crumb text. */
function crumbLabels(): string[] {
  return [...document.querySelectorAll('span[aria-hidden]')]
    .filter((s) => s.textContent?.trim() === '/')
    .map((sep) => (sep.parentElement?.textContent ?? '').replace('/', '').trim());
}

beforeEach(() => {
  viewer.isAdmin = true;
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ data: [] }) })));
});

describe('a page route\'s breadcrumb goes from the app to the page (objectui#12198)', () => {
  it('one crumb after the app pill — the page itself; no 「Pages」 type crumb', async () => {
    await mountPageRoute(MEMBER);
    expect(crumbLabels()).toEqual(['Welcome']);
  });
});

describe('a page offers no Studio entry to a caller without `manage_metadata` (objectui#12198)', () => {
  it('an organization owner — a workspace admin whose set withholds `manage_metadata` — sees none of the three', async () => {
    await mountPageRoute(ORG_OWNER);
    for (const id of HANDLES) expect(screen.queryByTestId(id), id).not.toBeInTheDocument();
  });

  it('a plain member — no admin flag, no system permission — sees none of the three', async () => {
    viewer.isAdmin = false;
    await mountPageRoute(MEMBER);
    for (const id of HANDLES) expect(screen.queryByTestId(id), id).not.toBeInTheDocument();
  });

  it('CONTROL — a workspace admin holding `manage_metadata` sees all three, the row and the button to one target', async () => {
    await mountPageRoute(AUTHOR);
    for (const id of HANDLES) expect(screen.getByTestId(id), id).toBeInTheDocument();
    const button = screen.getByTestId('app-design-in-studio-button').querySelector('a')!.getAttribute('href');
    expect(button).toContain('/studio/com.objectstack.cloud/');
    expect(screen.getByTestId('app-switcher-edit-in-studio')).toHaveAttribute('href', button!);
  });
});
