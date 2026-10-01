/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11295 — the object page's view tab draws a SERVED view's label as
 * served.
 *
 * ## The defect
 *
 * A view read from `/meta/view` is already translated for the request's locale,
 * and since objectstack#20731 the server keeps a published edit over the
 * packaged catalog. Every switcher tab then went through `viewLabel` with that
 * served label as the FALLBACK, so the packaged `_views.<key>.label` won it
 * back: measured on objectstack#20730, the `zh-CN` tab drew `进行中` over a
 * served `In Progress (edited-20730)`.
 *
 * ## Why not every tab
 *
 * A view the OBJECT document embeds (`listViews` on the object, read from
 * `/meta/object`) is not translated by the server — its `translateObject` does
 * not touch `listViews` — so the client bundle is that tab's only translation.
 * The tab asks the `/meta/view` read whether it served the view
 * (`useServedViewItems`); the object-embedded tab below is the control that it
 * still translates.
 *
 * Harness: the sibling relay pins' mocks (`ObjectView.viewDescriptionRelay-7199`),
 * with the REAL `ViewTabBar`, the real `useObjectLabel` under a real
 * `I18nProvider`, and a real `MetadataCtx` carrying the `/meta/view` answer.
 *
 * Directions, written before the run: the served-edit cells RED before the
 * change (the bundle answered), GREEN after; the unedited-served and the
 * object-embedded cells GREEN on both sides.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@object-ui/permissions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@object-ui/permissions')>();
  return {
    ...actual,
    usePermissions: () => ({
      check: () => ({ allowed: true }),
      checkField: () => true,
      getFieldPermissions: () => [],
      getRowFilter: () => undefined,
      getObjectApiOperations: () => undefined,
      roles: [],
      isLoaded: false,
      hasCapabilities: () => true,
      can: () => true,
      cannot: () => false,
    }),
    useFieldPermissions: () => ({ canRead: () => true, canWrite: () => true, permissions: [] }),
  };
});

vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ user: { id: 'u1', name: 'Ada' }, activeOrganization: null }),
  useWorkspaceAdminStatus: () => ({ isAdmin: false, isResolved: true }),
  createAuthenticatedFetch: () => vi.fn(),
}));

vi.mock('@object-ui/collaboration', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRealtimeSubscription: () => ({ lastMessage: null }),
  useConflictResolution: () => ({ hasConflicts: false, resolveAllConflicts: () => {} }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(), error: vi.fn(), info: vi.fn(),
    warning: vi.fn(), loading: vi.fn(), dismiss: vi.fn(),
  }),
}));

// The list body is not the subject: stubbed, so only the tab bar draws text.
vi.mock('@object-ui/plugin-list', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@object-ui/plugin-list')>()),
  ListView: () => null,
}));

// `ViewTabBar` stays REAL — it is what draws the label under test.
vi.mock('@object-ui/plugin-view', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ObjectView: (props: any) =>
    props.renderListView?.({
      schema: props.schema ?? {},
      dataSource: props.dataSource,
      onEdit: props.onEdit,
      className: '',
      refreshKey: 0,
    }) ?? null,
  ManageViewsDialog: () => null,
}));

vi.mock('./MetadataInspector', () => ({
  MetadataPanel: () => null,
  useMetadataInspector: () => ({ showDebug: false, toggle: () => {} }),
}));
vi.mock('./RecordDetailView', () => ({ RecordDetailView: () => null }));

import { I18nProvider } from '@object-ui/i18n';
import { MetadataCtx } from '@object-ui/react';
import { ObjectView } from './ObjectView';
import { ExpressionProvider } from '../providers/ExpressionProvider';

const OBJECT_NAME = 'showcase_task';
const VIEW_ID = 'showcase_task.in_progress';
const EDITED = 'In Progress (edited-11295)';
const PACKAGED = { en: 'In Progress', 'zh-CN': '进行中' } as const;
const EMBEDDED = { en: 'My Tasks', 'zh-CN': '我的任务' } as const;

/** The packaged catalog, as the console loads it into `I18nProvider`. */
const BUNDLE = {
  en: { showcase: { objects: { showcase_task: { label: 'Task', _views: { in_progress: { label: PACKAGED.en }, mine: { label: EMBEDDED.en } } } } } },
  'zh-CN': { showcase: { objects: { showcase_task: { label: '任务', _views: { in_progress: { label: PACKAGED['zh-CN'] }, mine: { label: EMBEDDED['zh-CN'] } } } } } },
};

/**
 * The object as `MetadataProvider` merges it — the served view item under its
 * qualified id, and `mine`, a view the object document embeds — plus the
 * `/meta/view` answer that served the first one.
 */
function world(servedLabel: string) {
  const viewItem = { name: VIEW_ID, object: OBJECT_NAME, viewKind: 'list', label: servedLabel, config: { type: 'grid', columns: ['name'] } };
  const objects = [
    {
      name: OBJECT_NAME,
      label: 'Task',
      fields: { name: { type: 'text', label: 'Name' } },
      listViews: {
        [VIEW_ID]: { type: 'grid', columns: ['name'], name: VIEW_ID, label: servedLabel, isDefault: true },
        mine: { type: 'grid', columns: ['name'], name: 'mine', label: 'Mine' },
      },
    },
  ];
  const metadata = {
    apps: [],
    objects,
    dashboards: [],
    reports: [],
    pages: [],
    loading: false,
    error: null,
    refresh: async () => {},
    invalidate: () => {},
    ensureType: async () => [],
    getItem: async () => null,
    getItemsByType: (type: string) => (type === 'view' ? [viewItem] : []),
    getTypeStatus: () => 'ready' as const,
  };
  return { objects, metadata };
}

function makeDataSource() {
  return {
    find: vi.fn(async () => ({ data: [], total: 0 })),
    findOne: vi.fn(async () => null),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
  } as any;
}

async function renderIn(language: 'en' | 'zh-CN', servedLabel: string) {
  const { objects, metadata } = world(servedLabel);
  render(
    <I18nProvider config={{ defaultLanguage: language, detectBrowserLanguage: false, resources: BUNDLE }}>
      <MetadataCtx.Provider value={metadata as any}>
        <ExpressionProvider user={{ id: 'u1', name: 'Ada', profile: 'admin' }}>
          <MemoryRouter initialEntries={[`/apps/showcase_app/${OBJECT_NAME}`]}>
            <Routes>
              <Route
                path="/apps/:appName/:objectName"
                element={<ObjectView dataSource={makeDataSource()} objects={objects} onEdit={() => {}} />}
              />
            </Routes>
          </MemoryRouter>
        </ExpressionProvider>
      </MetadataCtx.Provider>
    </I18nProvider>,
  );
  // The object-embedded tab is drawn in every world, so its arrival says the
  // tab bar rendered — waiting on the served label would hang on a regression.
  await waitFor(() => expect(screen.getAllByText(EMBEDDED[language]).length).toBeGreaterThan(0));
}

beforeEach(() => {
  cleanup();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'content-type': 'application/json' } }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const LANGUAGES = ['en', 'zh-CN'] as const;

describe('ObjectView — a served view tab is drawn as served (objectui#11295)', () => {
  it.each(LANGUAGES)('%s: a published edit renders as served, not as the packaged string', async (language) => {
    await renderIn(language, EDITED);

    expect(screen.getAllByText(EDITED).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(PACKAGED[language])).toHaveLength(0);
  });

  it.each(LANGUAGES)('%s: an unedited served view shows the translation the server put in', async (language) => {
    await renderIn(language, PACKAGED[language]);

    expect(screen.getAllByText(PACKAGED[language]).length).toBeGreaterThan(0);
  });

  it.each(LANGUAGES)('%s: control — a view the object document embeds is still named by the bundle', async (language) => {
    await renderIn(language, EDITED);

    // `renderIn` already waited for the bundle's name; the authored one is gone.
    expect(screen.queryAllByText('Mine')).toHaveLength(0);
  });
});
