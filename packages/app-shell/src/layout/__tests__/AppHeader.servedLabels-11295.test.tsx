// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * objectui#11295 — the breadcrumb names a SERVED view (and a served dashboard)
 * as served.
 *
 * ## What was measured
 *
 * objectstack#20730's browser reading, at the console's pinned objectui: with
 * the `showcase_task.in_progress` view published as `In Progress
 * (edited-20730)`, `/view/in_progress` drew `In Progress` in the `en`
 * breadcrumb and `进行中` in the `zh-CN` one, while `/meta/view` served the
 * edit in both. Two causes, one per locale, traced here:
 *
 *  - the crumb looked the view up by the URL segment as a KEY
 *    (`listViews['in_progress']`), but a served view's key is its qualified id
 *    (`showcase_task.in_progress`). It missed, and drew the humanized slug —
 *    `In Progress` — whatever the server had served (the `en` reading);
 *  - the text then went through the client bundle (`viewLabel`) as its
 *    fallback, and the packaged `_views.in_progress.label` won it (the `zh-CN`
 *    reading).
 *
 * Now the view is matched by `resolveViewId` (the matcher the object page opens
 * it with), and a view the `/meta/view` read served is drawn as given. A view
 * embedded in the OBJECT document is not translated by the server, so it keeps
 * the bundle — the control below. The dashboard crumb gets the same rule for a
 * dashboard the `/meta` read served.
 *
 * Harness: `AppHeader.systemBreadcrumbs-10969`'s mocks, except that
 * `useObjectLabel` is REAL here — the bundle lookup is the subject.
 *
 * Directions, written before the run: the served-edit cells RED before the
 * change (bare URL: the slug in `en`, the bundle in `zh-CN`; qualified URL and
 * dashboard: the bundle in both), GREEN after; the unedited-served and the
 * object-embedded cells GREEN on both sides.
 */
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

const route = vi.hoisted(() => ({ pathname: '/apps/showcase_app/showcase_task/view/in_progress' }));
const meta = vi.hoisted(() => ({ value: null as any }));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: route.pathname, search: '', hash: '', state: null, key: 't' }),
  useParams: () => ({ appName: 'showcase_app' }),
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()] as const,
  Link: ({ children, to, ...p }: any) => <a href={String(to)} {...p}>{children}</a>,
}));

vi.mock('@object-ui/components', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const stripProps = (p: any) => {
    const { asChild, variant, size, align, sideOffset, onOpenChange, ...rest } = p ?? {};
    return rest;
  };
  const Pass = ({ children, ...p }: any) => <div {...stripProps(p)}>{children}</div>;
  return {
    ...actual,
    Button: ({ children, asChild, variant, size, ...p }: any) => (
      <button type="button" {...p}>{children}</button>
    ),
    DropdownMenu: Pass,
    DropdownMenuTrigger: Pass,
    DropdownMenuContent: () => null,
    DropdownMenuItem: () => null,
    DropdownMenuLabel: () => null,
    DropdownMenuSeparator: () => null,
    DropdownMenuGroup: Pass,
    Avatar: Pass,
    AvatarImage: () => null,
    AvatarFallback: Pass,
    Popover: Pass,
    PopoverTrigger: Pass,
    PopoverContent: () => null,
    Tabs: Pass,
    TabsList: Pass,
    TabsTrigger: ({ children }: any) => <button type="button">{children}</button>,
    TabsContent: Pass,
    cn: (...c: any[]) => c.filter(Boolean).join(' '),
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
vi.mock('../LocaleSwitcher', () => ({ LocaleSwitcher: () => null }));
vi.mock('../ConnectionStatus', () => ({ ConnectionStatus: () => null }));
vi.mock('../AppSwitcher', () => ({ AppSwitcher: () => null }));
vi.mock('../LocalizedSidebarTrigger', () => ({ LocalizedSidebarTrigger: () => null }));
vi.mock('../PreviewBadge', () => ({ PreviewBadge: () => null }));
vi.mock('../WorkspaceSwitcher', () => ({ WorkspaceSwitcher: () => null }));

// ONE module-scope fetch double, never torn down: the header's pollers fire and
// forget, and may read after a test body returns (see the sibling suites).
vi.stubGlobal(
  'fetch',
  vi.fn(async () =>
    new Response(JSON.stringify({ data: [], items: [], agents: [], requests: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  ),
);

// The header reads its lists through this module; the served-view question goes
// to the same context through `@object-ui/react` (provided below) — one value.
vi.mock('../../providers/MetadataProvider', () => ({ useMetadata: () => meta.value }));
vi.mock('../../context/NavigationContext.js', () => ({
  useNavigationContext: () => ({ currentAppName: 'showcase_app', recordTitle: undefined }),
}));
vi.mock('@object-ui/auth', async (importOriginal) => {
  // ONE stable identity — a fresh closure per render re-arms every
  // `[getAuthConfig]` effect forever (see the sibling suites).
  const getAuthConfig = () => Promise.resolve({ features: { multiOrgEnabled: false } });
  return {
    ...(await importOriginal<Record<string, unknown>>()),
    useAuth: () => ({
      user: { id: 'u1', name: 'Zhang San', email: 'zs@example.com' },
      signOut: vi.fn(),
      isAuthEnabled: true,
      organizations: [],
      activeOrganization: null,
      isOrganizationsLoading: false,
      switchOrganization: vi.fn(),
      getAuthConfig,
    }),
    getUserInitials: () => 'ZS',
    useWorkspaceAdminStatus: () => ({ isAdmin: true, isResolved: true }),
  };
});
const fakeAdapter = { find: () => Promise.resolve({ data: [] }), getClient: () => undefined };
vi.mock('../../providers/AdapterProvider', () => ({ useAdapter: () => fakeAdapter }));

import { I18nProvider } from '@object-ui/i18n';
import { MetadataCtx } from '@object-ui/react';
import { AppHeader } from '../AppHeader';

afterEach(cleanup);

/** The packaged catalog, as the console loads it into `I18nProvider`. */
const BUNDLE = {
  en: {
    showcase: {
      objects: {
        showcase_task: { label: 'Task', _views: { in_progress: { label: 'In Progress' }, mine: { label: 'My Tasks' } } },
      },
      dashboards: { ops_board: { label: 'Operations' } },
    },
  },
  'zh-CN': {
    showcase: {
      objects: {
        showcase_task: { label: '任务', _views: { in_progress: { label: '进行中' }, mine: { label: '我的任务' } } },
      },
      dashboards: { ops_board: { label: '运营看板' } },
    },
  },
};

const VIEW_ID = 'showcase_task.in_progress';
const EDITED_VIEW = 'In Progress (edited-11295)';
const EDITED_DASHBOARD = 'Operations (edited-11295)';
const PACKAGED_VIEW = { en: 'In Progress', 'zh-CN': '进行中' } as const;
const PACKAGED_DASHBOARD = { en: 'Operations', 'zh-CN': '运营看板' } as const;

/**
 * One language's world: the `/meta/view` answer (one served view item), the
 * object as `MetadataProvider` merges it (that view under its qualified id,
 * plus `mine`, a view the OBJECT document embeds), and the `/meta/dashboard`
 * answer.
 */
function world(viewLabel: string, dashboardLabel: string) {
  const viewItem = { name: VIEW_ID, object: 'showcase_task', viewKind: 'list', label: viewLabel, config: { type: 'grid' } };
  const objects = [
    {
      name: 'showcase_task',
      label: 'Task',
      listViews: {
        [VIEW_ID]: { type: 'grid', name: VIEW_ID, label: viewLabel },
        mine: { type: 'grid', name: 'mine', label: 'Mine' },
      },
    },
  ];
  meta.value = {
    apps: [],
    objects,
    dashboards: [{ name: 'ops_board', label: dashboardLabel, widgets: [] }],
    reports: [],
    pages: [],
    loading: false,
    error: null,
    refresh: async () => {},
    invalidate: () => {},
    ensureType: async () => [],
    getItem: async () => null,
    getItemsByType: (type: string) => (type === 'view' ? [viewItem] : []),
    getTypeStatus: () => 'ready',
  };
  return objects;
}

function renderAt(pathname: string, language: 'en' | 'zh-CN', objects: any[]) {
  route.pathname = pathname;
  return render(
    <I18nProvider config={{ defaultLanguage: language, detectBrowserLanguage: false, resources: BUNDLE }} persistLanguage={false}>
      <MetadataCtx.Provider value={meta.value}>
        <AppHeader variant="app" appName="showcase_app" activeAppName="showcase_app" objects={objects} />
      </MetadataCtx.Provider>
    </I18nProvider>,
  );
}

const LANGUAGES = ['en', 'zh-CN'] as const;

describe('AppHeader — a served view is named as served (objectui#11295)', () => {
  it.each(LANGUAGES)('%s: bare URL — a published edit, not the slug or the packaged string', (language) => {
    renderAt('/apps/showcase_app/showcase_task/view/in_progress', language, world(EDITED_VIEW, EDITED_DASHBOARD));

    // The last segment is drawn twice — the desktop trail and the compact title.
    expect(screen.getAllByText(EDITED_VIEW).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(PACKAGED_VIEW[language])).toHaveLength(0);
  });

  it.each(LANGUAGES)('%s: qualified URL — a published edit, not the packaged string', (language) => {
    renderAt(`/apps/showcase_app/showcase_task/view/${VIEW_ID}`, language, world(EDITED_VIEW, EDITED_DASHBOARD));

    expect(screen.getAllByText(EDITED_VIEW).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(PACKAGED_VIEW[language])).toHaveLength(0);
  });

  it.each(LANGUAGES)('%s: an unedited served view shows the translation the server put in', (language) => {
    renderAt('/apps/showcase_app/showcase_task/view/in_progress', language, world(PACKAGED_VIEW[language], PACKAGED_DASHBOARD[language]));

    expect(screen.getAllByText(PACKAGED_VIEW[language]).length).toBeGreaterThan(0);
  });

  it('control — a view the OBJECT document embeds is not served translated, so the bundle names it', () => {
    renderAt('/apps/showcase_app/showcase_task/view/mine', 'zh-CN', world(EDITED_VIEW, EDITED_DASHBOARD));

    expect(screen.getAllByText('我的任务').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Mine')).toHaveLength(0);
  });
});

describe('AppHeader — a served dashboard is named as served (objectui#11295)', () => {
  it.each(LANGUAGES)('%s: a published edit, not the packaged string', (language) => {
    renderAt('/apps/showcase_app/dashboard/ops_board', language, world(EDITED_VIEW, EDITED_DASHBOARD));

    expect(screen.getAllByText(EDITED_DASHBOARD).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(PACKAGED_DASHBOARD[language])).toHaveLength(0);
  });

  it('control — a dashboard the `/meta` read did not serve is named by the bundle', () => {
    // No served document under this name: the crumb's text is the humanized
    // slug, which no server translated, so the bundle is its translation.
    const objects = world(EDITED_VIEW, EDITED_DASHBOARD);
    meta.value = { ...meta.value, dashboards: [] };
    renderAt('/apps/showcase_app/dashboard/ops_board', 'zh-CN', objects);

    expect(screen.getAllByText('运营看板').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Ops Board')).toHaveLength(0);
  });
});
