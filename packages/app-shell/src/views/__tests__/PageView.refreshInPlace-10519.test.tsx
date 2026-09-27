/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#10519 — a successful page-level action refreshes the page's DATA; it
 * does not rebuild the page (AGENTS.md #8's corollary: refresh data, don't
 * rebuild UI).
 *
 * ## The defect this pins
 *
 * `PageView` kept a `refreshKey` counter, bumped it from the console action
 * runtime's `onRefresh` — which fires after every successful `api`, flow and
 * server action, an undo, and a screen-flow completion — and keyed BOTH render
 * branches on it: `<InterfaceListPage key={refreshKey}>` and
 * `<SchemaRenderer key={refreshKey}>`. So one page action REMOUNTED the whole
 * page: every block's scroll, collapsed sections and in-progress edits went
 * with it, and every block refetched from scratch. Nothing read the counter off
 * the page context (measured on the card: a node carrying it reached no block).
 *
 * The host now declares the change on the data-invalidation bus instead —
 * `notifyDataChanged({ objectName: '*' })`: a page binds no object and the
 * runtime's refresh carries none, so the bus's documented unknown-scope value is
 * the page's scope — and the blocks that read the bus refetch in place.
 *
 * ## The two halves, and which world each one can fail in
 *
 * Every in-place case asserts BOTH:
 *   (a) the SAME mounted tree after the action — a block instance id from a
 *       `useState` initializer, DOM nodes read before the action, a scroll
 *       offset, a collapsed accordion panel and a half-typed field all survive;
 *   (b) each bus-reading block re-read exactly once.
 * Against the pre-fix source (a) is the red half; (b) stays green there,
 * because that world refetched too, through the remount. (b) is the half that
 * goes red when the key leaves without the host declaring the change on the
 * bus — the regression a naive "remove the key" would ship.
 *
 * ## What renders for real
 *
 * `PageView`, the console action runtime, the `page`, `page:accordion` and
 * `action:button` renderers from `@object-ui/components`, `object-metric` from
 * `@object-ui/plugin-dashboard` and `object-form` from `@object-ui/plugin-form`
 * (real bus readers; both are this package's devDependencies); the interface
 * branch renders the real `InterfaceListPage` over `plugin-list`'s `ListView`.
 * The stand-in registered as `object-gantt` follows the
 * `ObjectView.refreshInPlace-10035` precedent (`app-shell` does not depend on
 * `plugin-gantt`): it reads the REAL bus hook, counts its own queries, and
 * carries an instance id and a scroll box.
 *
 * The page action is a real `api` action through the runtime's `apiHandler`
 * — an authenticated raw-HTTP call, so no dataSource `onMutation` fires — the
 * class of write that reached the blocks only through the remount.
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const authFetchSpy = vi.fn();
vi.mock('@object-ui/auth', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAuth: () => ({ user: { id: 'u1', name: 'Ada', role: 'user', image: null }, activeOrganization: null }),
  useWorkspaceAdminStatus: () => ({ isAdmin: false, isResolved: true }),
  createAuthenticatedFetch: () => authFetchSpy,
}));

vi.mock('@object-ui/i18n', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  // `language` is read by the `page:accordion` label pass; without it the
  // renderer throws and the schema error boundary recreates the subtree,
  // which would count as a remount here.
  useObjectTranslation: () => ({ t: (k: string, o?: any) => o?.defaultValue ?? o?.name ?? k, language: 'en' }),
  useObjectLabel: () => ({
    fieldLabel: (_o: any, _n: any, l: any) => l,
    fieldOptionLabel: (_o: any, _f: any, _v: any, l: any) => l,
    actionParamText: (_o: any, _a: any, _p: any, _attr: any, fallback: any) => fallback,
  }),
  // The form layouts build their discard-guard strings with this; echo the
  // supplied English defaults.
  createSafeTranslation:
    (defaults: Record<string, string>) => () => ({
      t: (k: string) => defaults?.[k] ?? k,
    }),
}));

vi.mock('@object-ui/permissions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@object-ui/permissions')>();
  // STABLE identities: `ListView` names `perms` in its fetch dependency list,
  // so a fresh object per call would loop the fetch on its own.
  const perms = {
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
  };
  const fieldPerms = { canRead: () => true, canWrite: () => true, permissions: [] };
  return { ...actual, usePermissions: () => perms, useFieldPermissions: () => fieldPerms };
});

/** The stored page document the next mount resolves. */
let storedPage: Record<string, unknown> = {};

vi.mock('../../providers/MetadataProvider', () => ({
  useMetadata: () => ({ pages: [storedPage], objects: OBJECTS, getTypeStatus: () => 'ready' }),
}));

vi.mock('../MetadataInspector', () => ({
  MetadataPanel: () => null,
  useMetadataInspector: () => ({ showDebug: false }),
}));
vi.mock('../RecordDetailView', () => ({ RecordDetailView: () => null }));

import { ComponentRegistry } from '@object-ui/core';
import { AdapterCtx, SchemaRendererProvider, notifyDataChanged, useDataInvalidation } from '@object-ui/react';
import { registerAllFields } from '@object-ui/fields';
// Side-effect imports: `page`, `page:accordion` and `action:button`, then the
// two real bus readers the page embeds.
import '@object-ui/components';
import '@object-ui/plugin-dashboard';
import '@object-ui/plugin-form';
import { PageView } from '../PageView';

registerAllFields();

const OBJECT = 'deal';

const FIELDS = {
  id: { type: 'text', label: 'Id' },
  name: { type: 'text', label: 'Name' },
  note: { type: 'text', label: 'Note' },
  stage: { type: 'select', label: 'Stage', options: [{ label: 'A', value: 'a' }] },
  amount: { type: 'number', label: 'Amount' },
};

/** One object with one list view (the interface branch's source) and one page action. */
const OBJECTS = [
  {
    name: OBJECT,
    label: 'Deal',
    fields: FIELDS,
    listViews: {
      all: { label: 'All', columns: ['name', 'stage'], description: 'Every deal' },
    },
    actions: [{ name: 'create_env', label: 'Create environment', type: 'api', target: '/api/v1/environments' }],
  },
];

/** The stand-in's own queries, and the instance ids it mounted with. */
let ganttQueries = 0;
let ganttInstanceSeq = 0;

/**
 * A self-fetching visualization that refetches on the bus, like `ObjectGantt`,
 * with the UI state a remount destroys: an instance id and a scroll box.
 */
function GanttStandIn({ schema }: any) {
  const [id] = React.useState(() => ++ganttInstanceSeq);
  const nonce = useDataInvalidation(schema?.objectName);
  React.useEffect(() => {
    ganttQueries++;
  }, [nonce]);
  return (
    <div data-testid="gantt-stand-in" data-instance={id}>
      <div data-testid="gantt-scroll" className="h-10 overflow-auto">
        <div className="h-96" />
      </div>
    </div>
  );
}

function makeDataSource() {
  const record = { id: 'r1', name: 'Server v1', note: 'n1', updated_at: '2026-01-01T00:00:00.000Z' };
  return {
    find: vi.fn(async () => ({ data: [{ id: 'r1', name: 'Acme', stage: 'a', amount: 7 }], total: 1 })),
    findOne: vi.fn(async () => ({ ...record })),
    aggregate: vi.fn(async () => [{ amount: 7 }]),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
    getObjectSchema: vi.fn(async (name: string) => ({ name, label: 'Deal', fields: FIELDS })),
  };
}
type DS = ReturnType<typeof makeDataSource>;

/** The list queries `ListView` issued; its `$top: 0` count probe is excluded. */
const listQueries = (ds: DS) => ds.find.mock.calls.filter((c: any[]) => c[1]?.$top !== 0).length;

/** A window long enough for every effect a step schedules to have fired. */
const settle = (ms = 300) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));

const ACTION_NODE = {
  type: 'action:button',
  name: 'create_env',
  label: 'Create environment',
  actionType: 'api',
  target: '/api/v1/environments',
};

/** The rendered page: a page action beside three data blocks and a collapsible panel. */
const PAGE = {
  name: 'home',
  label: 'Home',
  type: 'app',
  children: [
    ACTION_NODE,
    { type: 'object-metric', id: 'metric', objectName: OBJECT, aggregate: { field: 'amount', function: 'sum' }, label: 'Pipeline' },
    { type: 'object-gantt', id: 'gantt', objectName: OBJECT },
    {
      type: 'object-form',
      id: 'form',
      objectName: OBJECT,
      mode: 'edit',
      recordId: 'r1',
      sections: [{ name: 'main', label: 'Main', fields: ['name', 'note'] }],
    },
    {
      type: 'page:accordion',
      id: 'panels',
      items: [{ label: 'Notes', collapsed: false, children: [{ type: 'page:section', id: 'notes', children: [] }] }],
    },
  ],
};

/** ADR-0047 interface mode: the page binds the `all` view and offers the same action as a toolbar button. */
const INTERFACE_PAGE = {
  name: 'deals',
  label: 'Deals',
  type: 'list',
  interfaceConfig: { source: OBJECT, sourceView: 'all', buttons: ['create_env'] },
};

/**
 * Mounts the page under both data-source contexts the console provides:
 * `AdapterCtx` is what `PageView` and `InterfaceListPage` read through
 * `useAdapter()`, and `SchemaRendererProvider` is what the embedded blocks read.
 */
function mount(page: Record<string, unknown>) {
  storedPage = page;
  const ds = makeDataSource();
  render(
    <AdapterCtx.Provider value={ds as never}>
      <SchemaRendererProvider dataSource={ds as any}>
        <MemoryRouter initialEntries={[`/apps/demo/page/${page.name as string}`]}>
          <Routes>
            <Route path="/apps/:app/page/:pageName" element={<PageView />} />
          </Routes>
        </MemoryRouter>
      </SchemaRendererProvider>
    </AdapterCtx.Provider>,
  );
  return ds;
}

/** Runs the page's `api` action through the console runtime and waits for its refresh. */
async function runPageAction() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Create environment' }));
  });
  await waitFor(() => expect(authFetchSpy).toHaveBeenCalled());
  await settle();
}

const nameInput = () => document.body.querySelector('input[name="name"]') as HTMLInputElement;
const ganttInstance = () => screen.getByTestId('gantt-stand-in').dataset.instance;
const accordionTrigger = () => screen.getByRole('button', { name: 'Notes' });

beforeEach(() => {
  cleanup();
  ganttQueries = 0;
  ganttInstanceSeq = 0;
  ComponentRegistry.register('object-gantt', GanttStandIn as any);
  authFetchSpy.mockReset();
  authFetchSpy.mockResolvedValue({ ok: true, json: async () => ({ id: 'env_1' }) });
  // Best-effort metadata probes are not what these cases are about.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'content-type': 'application/json' } })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('a page action refreshes the page in place (objectui#10519)', () => {
  it('SchemaRenderer branch: the same page keeps its scroll, collapsed panel and half-typed field, and each bus reader re-reads once', async () => {
    const ds = mount(PAGE);
    await waitFor(() => expect(nameInput()?.value).toBe('Server v1'));
    await waitFor(() => expect(ds.aggregate).toHaveBeenCalledTimes(1));
    await settle();
    expect(ganttQueries, 'the stand-in must be drawing this page').toBeGreaterThan(0);
    expect(ganttInstanceSeq, 'mount control: exactly one stand-in instance before the action').toBe(1);

    // UI state the action must not reset.
    const instance = ganttInstance();
    const scrollBox = screen.getByTestId('gantt-scroll');
    scrollBox.scrollTop = 120;
    const metricNode = screen.getByText('Pipeline');
    const input = nameInput();
    fireEvent.change(input, { target: { value: 'User typed' } });
    await settle(150);
    fireEvent.click(accordionTrigger());
    await settle(150);
    expect(accordionTrigger().getAttribute('aria-expanded'), 'setup: the panel must be collapsed before the action').toBe('false');

    const aggregatesBefore = ds.aggregate.mock.calls.length;
    const ganttBefore = ganttQueries;

    await runPageAction();

    // (a) the same tree
    expect(
      ganttInstanceSeq,
      '(a) The page action REMOUNTED the page: the `SchemaRenderer` consumer mounted a second\n'
        + 'time. The refresh counter is back in the `<SchemaRenderer>` key (AGENTS.md #8: refresh\n'
        + 'data, don\'t rebuild UI).',
    ).toBe(1);
    expect(ganttInstance(), '(a) the action REMOUNTED the visualization itself').toBe(instance);
    expect(screen.getByTestId('gantt-scroll'), '(a) the scroll box was replaced').toBe(scrollBox);
    expect(screen.getByTestId('gantt-scroll').scrollTop, '(a) the scroll position was lost').toBe(120);
    expect(screen.getByText('Pipeline'), '(a) the metric was replaced').toBe(metricNode);
    expect(nameInput(), '(a) the form was replaced').toBe(input);
    expect(nameInput().value, '(a) the in-progress edit was lost').toBe('User typed');
    expect(accordionTrigger().getAttribute('aria-expanded'), '(a) the collapsed panel re-opened').toBe('false');

    // (b) each bus reader re-read exactly once
    expect(
      ds.aggregate.mock.calls.length - aggregatesBefore,
      '(b) The metric did not re-read after the action, or re-read more than once. The host\n'
        + 'must declare the change on the data-invalidation bus (`notifyDataChanged`) now that\n'
        + 'the page is no longer remounted to show it the write.',
    ).toBe(1);
    expect(ganttQueries - ganttBefore, '(b) the stand-in did not re-query exactly once').toBe(1);
  });

  it('interface branch: the same list re-issues its query once', async () => {
    const ds = mount(INTERFACE_PAGE);
    // A node rendered INSIDE `ListView` (its toolbar's own refresh control) —
    // replaced wholesale by a key remount of the branch above it.
    await waitFor(() => expect(screen.getByTestId('refresh-button')).toBeTruthy());
    await waitFor(() => expect(listQueries(ds)).toBeGreaterThan(0));
    await settle();

    const page = screen.getByTestId('interface-list-page');
    const node = screen.getByTestId('refresh-button');
    const before = listQueries(ds);

    await runPageAction();

    expect(
      screen.getByTestId('interface-list-page'),
      '(a) The page action REMOUNTED the interface page: the refresh counter is back in the\n'
        + '`<InterfaceListPage>` key (AGENTS.md #8: refresh data, don\'t rebuild UI).',
    ).toBe(page);
    expect(screen.getByTestId('refresh-button'), '(a) the action REMOUNTED the list').toBe(node);
    expect(
      listQueries(ds) - before,
      '(b) The list did not re-query after the action, or re-queried more than once. It reads\n'
        + 'the data-invalidation bus, so the host must declare the change there.',
    ).toBe(1);
  });

  it('lit control: a change declared on the bus reaches the same readers once, without any action', async () => {
    const ds = mount(PAGE);
    await waitFor(() => expect(ds.aggregate).toHaveBeenCalledTimes(1));
    await settle();
    const aggregatesBefore = ds.aggregate.mock.calls.length;
    const ganttBefore = ganttQueries;

    await act(async () => {
      notifyDataChanged({ objectName: '*' });
    });
    await settle();

    expect(ds.aggregate.mock.calls.length - aggregatesBefore, 'control: the metric does not read the bus in this harness').toBe(1);
    expect(ganttQueries - ganttBefore, 'control: the stand-in does not read the bus in this harness').toBe(1);
    expect(authFetchSpy, 'control: no action ran').not.toHaveBeenCalled();
  });
});
