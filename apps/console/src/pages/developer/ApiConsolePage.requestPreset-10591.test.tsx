// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * The API console's request preset, and the tool preview link that carries it
 * (objectui#10591).
 *
 * ## The defect
 *
 * The tool preview's "Open in API Console" link was the bare
 * `/developer/api-console?path=…`. The console's root route table declares no
 * `/developer` route, so its catch-all sent the author home. And even at the
 * right URL the preset was dropped: this page read no query string at all.
 *
 * ## What this file pins
 *
 *   1. The page reads `?path=` (and `?method=`) once, on mount, into the
 *      request editor, and sends nothing. With no query it opens exactly as
 *      before (the control), and a `path` that is not a same-origin API path
 *      is ignored.
 *   2. Both mounts honour it: the standalone `developer/api-console` route from
 *      this host's REAL `systemRoutes`, and the `developer:api-console`
 *      registry key served by app-shell's REAL `DefaultAppContent`.
 *   3. End to end: the href the REAL tool preview draws, followed into that
 *      route table, reaches this page pre-filled, not the root catch-all.
 *
 * ## Scope of the stubs
 *
 * The page, the tool preview, the registration module, the route table and
 * the link builder are all the production ones. The shell around the route
 * table is stubbed the way `__tests__/orphanedPageComponentRefs-10520.test.tsx`
 * stubs it, for the reasons given there. The root route table in `App.tsx` is
 * not exported, so its `path="*"` catch-all (a redirect home) is stood in for
 * by a probe; a harness control below proves that probe is reachable.
 * `fetch` is stubbed so the page's endpoint discovery has an answer, and so
 * every request the page makes is recorded.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';

vi.mock('../../../../../packages/app-shell/src/views/metadata-admin', () => ({
  MetadataDirectoryPage: () => <div data-testid="metadata-directory-page" />,
  StudioHomePage: () => <div data-testid="studio-home-page" />,
  MetadataResourceListPage: () => <div data-testid="metadata-resource-list-page" />,
  MetadataResourceEditPage: () => <div data-testid="metadata-resource-edit-page" />,
  MetadataResourceHistoryPage: () => <div data-testid="metadata-resource-history-page" />,
  MetadataDiagnosticsPage: () => <div data-testid="metadata-diagnostics-page" />,
  MetadataResourceRouter: () => <div data-testid="metadata-resource-router" />,
  registerMetadataResource: () => {},
}));
vi.mock('../../../../../packages/app-shell/src/console/marketplace/MarketplacePage', () => ({
  MarketplacePage: () => <div data-testid="marketplace-page" />,
}));
vi.mock('../../../../../packages/app-shell/src/console/marketplace/MarketplaceInstalledPage', () => ({
  MarketplaceInstalledPage: () => <div data-testid="marketplace-installed-page" />,
}));
vi.mock('../../../../../packages/app-shell/src/console/marketplace/MarketplacePackagePage', () => ({
  MarketplacePackagePage: () => <div data-testid="marketplace-package-page" />,
}));
vi.mock('@object-ui/plugin-designer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@object-ui/plugin-designer')>()),
  CreateAppPage: () => <div data-testid="create-app-page" />,
  EditAppPage: () => <div data-testid="edit-app-page" />,
  DashboardDesignPage: () => <div data-testid="dashboard-design-page" />,
}));
vi.mock('../../../../../packages/app-shell/src/layout/ConsoleLayout', () => ({
  ConsoleLayout: ({ activeAppName, children }: { activeAppName?: string; children?: React.ReactNode }) => (
    <div data-testid="console-layout" data-active-app={activeAppName}>
      {children}
    </div>
  ),
}));
vi.mock('../../../../../packages/app-shell/src/chrome/CommandPalette', () => ({ CommandPalette: () => null }));
vi.mock('../../../../../packages/app-shell/src/chrome/KeyboardShortcutsDialog', () => ({ KeyboardShortcutsDialog: () => null }));
vi.mock('../../../../../packages/app-shell/src/chrome/OnboardingWalkthrough', () => ({ OnboardingWalkthrough: () => null }));
vi.mock('../../../../../packages/app-shell/src/views/ObjectView', () => ({
  ObjectView: () => <div data-testid="object-view" />,
}));

vi.mock('@object-ui/i18n', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useObjectTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => String(options?.defaultValue ?? key),
  }),
  useObjectLabel: () => ({
    objectLabel: ({ label }: { label?: string }) => label,
  }),
}));
vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({
    user: null,
    getAuthConfig: async () => ({ features: {} }),
    activeOrganization: null,
  }),
  useWorkspaceAdminStatus: () => ({ isAdmin: true, isResolved: true }),
}));
const dataSourceStub = {
  onConnectionStateChange: () => () => {},
  getConnectionState: () => 'connected',
};
vi.mock('../../../../../packages/app-shell/src/providers/AdapterProvider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAdapter: () => dataSourceStub,
}));
vi.mock('../../../../../packages/app-shell/src/providers/MetadataProvider', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMetadata: () => ({
    apps: [
      { name: 'setup', label: 'Setup', isDefault: true, navigation: [] },
      { name: 'studio', label: 'Studio', navigation: [] },
    ],
    objects: [],
    loading: false,
    ensureType: undefined,
    error: null,
    refresh: vi.fn(async () => {}),
  }),
}));

import { DefaultAppContent, getMetadataPreview } from '@object-ui/app-shell';
import { systemRoutes } from '../../AppContent';
// Imported at module scope, not only reached through `lazy()`: the route table
// and the registry both lazy-import this module, and ESM caches it by resolved
// specifier, so their factories resolve at once (AGENTS.md §测试纪律).
import { ApiConsolePage } from './ApiConsolePage';
// Side effect under test: registers `developer:api-console`, the way `main.tsx` does.
import '../../registerDeveloperComponents';

const TOOL = 'delete_all_orders';
const EXECUTE_PATH = `/api/v1/ai/tools/${TOOL}/execute`;

const fetchSpy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
  new Response('{}', { status: 404, headers: { 'Content-Type': 'application/json' } }),
);

beforeEach(() => {
  fetchSpy.mockClear();
  vi.stubGlobal('fetch', fetchSpy);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Every URL the page has fetched so far. Endpoint discovery accounts for some. */
const fetchedUrls = () => fetchSpy.mock.calls.map(([input]) => String(input));

const urlField = () => screen.getByPlaceholderText('/api/v1/...') as HTMLInputElement;
const methodField = () => screen.getByRole('combobox') as HTMLSelectElement;

function renderPageAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="*" element={<ApiConsolePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ApiConsolePage request preset (objectui#10591)', () => {
  it('opens with the tool execute path and method pre-filled, and sends nothing', async () => {
    renderPageAt(`/?path=${encodeURIComponent(EXECUTE_PATH)}&method=POST`);

    expect(urlField()).toHaveValue(EXECUTE_PATH);
    expect(methodField()).toHaveValue('POST');
    // POST shows the body editor, as picking the verb by hand would.
    expect(screen.getByText('Request Body (JSON)')).toBeInTheDocument();
    // Let endpoint discovery settle (its built-in Auth group is listed even
    // with no discovery payload), then check nothing hit the preset.
    expect(await screen.findByText('Auth')).toBeInTheDocument();
    expect(fetchedUrls().some((u) => u.includes('/ai/tools/'))).toBe(false);
    expect(screen.queryByText('Sending request...')).not.toBeInTheDocument();
  });

  it('control: with no query string it opens exactly as before', async () => {
    renderPageAt('/');

    expect(urlField()).toHaveValue('');
    expect(methodField()).toHaveValue('GET');
    expect(screen.queryByText('Request Body (JSON)')).not.toBeInTheDocument();
    expect(await screen.findByText('Auth')).toBeInTheDocument();
  });

  it.each([
    ['an absolute URL to another origin', 'http://evil.example/api/v1/ai/tools/x/execute'],
    ['a protocol-relative URL', '//evil.example/api/v1/ai/tools/x/execute'],
    ['a path outside /api/', '/apps/studio'],
    ['an empty value', ''],
  ])('ignores %s, and the method riding with it', (_label, path) => {
    renderPageAt(`/?path=${encodeURIComponent(path)}&method=DELETE`);

    expect(urlField()).toHaveValue('');
    expect(methodField()).toHaveValue('GET');
  });

  it('accepts the method in any case, and ignores a verb the selector does not offer', () => {
    renderPageAt(`/?path=${encodeURIComponent(EXECUTE_PATH)}&method=patch`);
    expect(methodField()).toHaveValue('PATCH');
    cleanup();

    renderPageAt(`/?path=${encodeURIComponent(EXECUTE_PATH)}&method=TRACE`);
    expect(urlField()).toHaveValue(EXECUTE_PATH);
    expect(methodField()).toHaveValue('GET');
  });

  it('reads the preset once: a later query change does not overwrite the editor', () => {
    function Retarget() {
      const navigate = useNavigate();
      return (
        <button type="button" onClick={() => navigate('/?path=/api/v1/health&method=GET')}>
          retarget
        </button>
      );
    }
    render(
      <MemoryRouter initialEntries={[`/?path=${encodeURIComponent(EXECUTE_PATH)}&method=POST`]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <Retarget />
                <ApiConsolePage />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'retarget' }));

    expect(urlField()).toHaveValue(EXECUTE_PATH);
    expect(methodField()).toHaveValue('POST');
  });
});

/**
 * The console as it routes an in-app URL: app-shell's REAL `DefaultAppContent`
 * with this host's REAL `systemRoutes`, under `/apps/:appName/*`, beside a
 * stand-in for the root table's catch-all (the redirect home).
 */
function renderConsoleAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/apps/:appName/*"
          element={<DefaultAppContent extraRoutes={systemRoutes} extraRoutesNoApp={systemRoutes} />}
        />
        <Route path="*" element={<div data-testid="root-catch-all" />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** The href the REAL tool preview draws for `TOOL`, opened from Studio. */
function toolPreviewHref(): string {
  const ToolPreview = getMetadataPreview('tool');
  if (!ToolPreview) throw new Error('the tool preview is not registered');
  render(
    <MemoryRouter initialEntries={[`/apps/studio/metadata/tool/${TOOL}`]}>
      <Routes>
        <Route
          path="/apps/:appName/*"
          element={<ToolPreview type="tool" name={TOOL} draft={{ name: TOOL, label: 'Delete All Orders' }} />}
        />
      </Routes>
    </MemoryRouter>,
  );
  const href = screen.getByRole('link', { name: /open in api console/i }).getAttribute('href');
  cleanup();
  if (!href) throw new Error('the tool preview drew no href');
  return href;
}

describe('the request preset through the console route table (objectui#10591)', () => {
  it("the tool preview's link reaches the API console pre-filled, not the root catch-all", async () => {
    renderConsoleAt(toolPreviewHref());

    expect(await screen.findByPlaceholderText('/api/v1/...')).toHaveValue(EXECUTE_PATH);
    expect(methodField()).toHaveValue('POST');
    expect(screen.queryByTestId('root-catch-all')).not.toBeInTheDocument();
    expect(screen.queryByText('Component not registered')).not.toBeInTheDocument();
    expect(fetchedUrls().some((u) => u.includes('/ai/tools/'))).toBe(false);
  });

  it.each([
    ['the developer:api-console registry key', 'component/developer/api-console'],
    ['the standalone developer/api-console route', 'developer/api-console'],
  ])('%s honours the preset', async (_label, route) => {
    renderConsoleAt(`/apps/studio/${route}?path=${encodeURIComponent(EXECUTE_PATH)}&method=POST`);

    expect(await screen.findByPlaceholderText('/api/v1/...')).toHaveValue(EXECUTE_PATH);
    expect(methodField()).toHaveValue('POST');
  });

  it('harness control: an app-less URL reaches the root catch-all, not the console', async () => {
    renderConsoleAt(`/developer/api-console?path=${encodeURIComponent(EXECUTE_PATH)}`);

    expect(await screen.findByTestId('root-catch-all')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('/api/v1/...')).not.toBeInTheDocument();
  });
});
