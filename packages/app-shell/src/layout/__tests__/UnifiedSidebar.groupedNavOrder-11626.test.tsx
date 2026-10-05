// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * UnifiedSidebar — a personal order made within a group of a grouped app
 * menu is stored under that group's `id` and restored on the next load
 * (objectui#11626).
 *
 * The store (`useNavOrder`, localStorage `objectui-nav-order-<app>`) kept one
 * order, `__root__`, and the renderer drew no grip on a grouped menu, so on
 * every stock app the shell's `enableReorder` did nothing. Triage's direction
 * (`5986793209`): an order per group key beside `__root__`; a group's key is its
 * `id`, which holds across reloads and locales where its label does not.
 *
 * This pins the WIRING in the real sidebar: the real `NavigationRenderer`
 * reports a move through `onReorder`, the real store writes it, and a fresh
 * mount reads it back. The group-free app's `__root__` record is pinned
 * byte-for-byte, because it must not change.
 *
 * Instrument: a module mock of `@dnd-kit/core` that renders the REAL
 * `DndContext` and records its `onDragEnd` by context `id` (the one
 * `NavigationRenderer.groupedReorder-11626.test.tsx` uses, after
 * `plugin-kanban`'s `sameColumnDropIsNotClaimed-8826.test.tsx`).
 * Harness: the provider / chrome mocks of
 * `UnifiedSidebar.navLabelInheritsTarget-9868.test.tsx`; `@object-ui/layout`
 * and `@object-ui/components` stay REAL.
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { NavigationItem } from '@object-ui/types';

type DragEnd = (event: { active: { id: string }; over: { id: string } | null }) => void;

const dnd = vi.hoisted(() => ({ byContext: new Map<string, DragEnd>() }));
// The nav ids the (mocked) pin store answers as pinned.
const pins = vi.hoisted(() => ({ ids: new Set<string>() }));

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  const ReactMod = await import('react');
  const CapturingDndContext = (props: Record<string, unknown>) => {
    dnd.byContext.set(String(props.id ?? '(no id)'), props.onDragEnd as DragEnd);
    return ReactMod.createElement(actual.DndContext, props as never);
  };
  return { ...actual, DndContext: CapturingDndContext };
});

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
  useNavPins: () => ({
    togglePin: vi.fn(),
    applyPins: (items: NavigationItem[]) => {
      const walk = (list: NavigationItem[]): NavigationItem[] =>
        list.map((item) => ({
          ...item,
          ...(item.type !== 'separator' && pins.ids.has(item.id) ? { pinned: true } : {}),
          ...(item.children ? { children: walk(item.children) } : {}),
        }) as NavigationItem);
      return walk(items);
    },
  }),
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

const STORE = 'objectui-nav-order-crm';

const entry = (id: string, label: string, extra: Partial<NavigationItem> = {}): NavigationItem =>
  ({ id, type: 'object', objectName: id, label, ...extra }) as NavigationItem;

/** The stock showcase's shape: top-level entries, then groups keyed by `id`. */
const GROUPED: NavigationItem[] = [
  entry('nav_map', 'Map'),
  entry('nav_start', 'Start'),
  {
    id: 'grp_sales',
    type: 'group',
    // A translated label: the store must not key on it.
    label: 'Sales',
    children: [entry('nav_accounts', 'Accounts'), entry('nav_contacts', 'Contacts'), entry('nav_leads', 'Leads')],
  },
  {
    id: 'grp_ops',
    type: 'group',
    label: 'Operations',
    children: [entry('nav_tasks', 'Tasks'), entry('nav_projects', 'Projects')],
  },
];

function sidebarUi(navigation: NavigationItem[]) {
  metadataState = {
    apps: [{ name: 'crm', label: 'CRM', active: true, navigation }],
    objects: [],
  };
  return (
    <MemoryRouter initialEntries={['/apps/crm']}>
      <SidebarProvider>
        <UnifiedSidebar activeAppName="crm" />
      </SidebarProvider>
    </MemoryRouter>
  );
}

function drop(contextId: string, activeId: string, overId: string) {
  const onDragEnd = dnd.byContext.get(contextId);
  expect(onDragEnd, `a DndContext with id ${contextId} was mounted`).toBeTypeOf('function');
  act(() => onDragEnd!({ active: { id: activeId }, over: { id: overId } }));
}

const stored = () => JSON.parse(localStorage.getItem(STORE) ?? 'null');
/** The link texts in document order, limited to the given names. */
const linkOrder = (names: string[]) =>
  screen
    .getAllByRole('link')
    .map((a) => a.textContent ?? '')
    .filter((text) => names.includes(text));

beforeEach(() => {
  localStorage.clear();
  dnd.byContext.clear();
  pins.ids = new Set();
});

describe('UnifiedSidebar — a grouped app menu keeps a personal order per group (objectui#11626)', () => {
  it('the shell draws a grip on the grouped menu', () => {
    const { container } = render(sidebarUi(GROUPED));
    expect(container.querySelectorAll('[aria-label="Drag to reorder"]')).toHaveLength(7);
  });

  it('a move within one group stores that group’s order under its id, and nothing else', () => {
    render(sidebarUi(GROUPED));

    drop('nav-reorder-group-grp_sales', 'nav_leads', 'nav_accounts');

    expect(stored()).toEqual({ grp_sales: ['nav_leads', 'nav_accounts', 'nav_contacts'] });
    // Drawn in the new order at once.
    expect(linkOrder(['Accounts', 'Contacts', 'Leads'])).toEqual(['Leads', 'Accounts', 'Contacts']);
  });

  it('the order is restored after a reload, and the rest of the menu follows the app', () => {
    const first = render(sidebarUi(GROUPED));
    drop('nav-reorder-group-grp_sales', 'nav_leads', 'nav_accounts');
    first.unmount();

    render(sidebarUi(GROUPED));
    expect(linkOrder(['Accounts', 'Contacts', 'Leads'])).toEqual(['Leads', 'Accounts', 'Contacts']);
    expect(linkOrder(['Map', 'Start'])).toEqual(['Map', 'Start']);
    expect(linkOrder(['Tasks', 'Projects'])).toEqual(['Tasks', 'Projects']);
  });

  it('a second group’s move is stored beside the first; a top-level move beside both', () => {
    render(sidebarUi(GROUPED));

    drop('nav-reorder-group-grp_sales', 'nav_leads', 'nav_accounts');
    drop('nav-reorder-group-grp_ops', 'nav_projects', 'nav_tasks');
    expect(stored()).toEqual({
      grp_sales: ['nav_leads', 'nav_accounts', 'nav_contacts'],
      grp_ops: ['nav_projects', 'nav_tasks'],
    });

    drop('nav-reorder-top-nav_map', 'nav_start', 'nav_map');
    expect(stored()).toEqual({
      grp_sales: ['nav_leads', 'nav_accounts', 'nav_contacts'],
      grp_ops: ['nav_projects', 'nav_tasks'],
      __root__: ['nav_start', 'nav_map', 'grp_sales', 'grp_ops'],
    });
    expect(linkOrder(['Map', 'Start'])).toEqual(['Start', 'Map']);
    expect(linkOrder(['Tasks', 'Projects'])).toEqual(['Projects', 'Tasks']);
  });

  it('a pinned entry and a gated-away entry keep working through a move', () => {
    pins.ids = new Set(['nav_contacts']);
    const navigation: NavigationItem[] = [
      {
        id: 'grp_sales',
        type: 'group',
        label: 'Sales',
        children: [
          entry('nav_accounts', 'Accounts'),
          entry('nav_hidden', 'Hidden', { visible: false } as Partial<NavigationItem>),
          entry('nav_contacts', 'Contacts'),
        ],
      },
    ];
    const first = render(sidebarUi(navigation));
    const favorites = () => within(screen.getByText('Favorites').closest('[data-sidebar="group"]') as HTMLElement);
    expect(favorites().getByRole('link', { name: 'Contacts' })).toBeInTheDocument();

    drop('nav-reorder-group-grp_sales', 'nav_contacts', 'nav_accounts');

    // The gated-away id keeps its place in the stored order; it stays hidden.
    expect(stored()).toEqual({ grp_sales: ['nav_contacts', 'nav_accounts', 'nav_hidden'] });
    expect(screen.queryByRole('link', { name: 'Hidden' })).not.toBeInTheDocument();
    first.unmount();

    render(sidebarUi(navigation));
    expect(favorites().getByRole('link', { name: 'Contacts' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Hidden' })).not.toBeInTheDocument();
  });
});

describe('UnifiedSidebar — a saved order holds where the app authors `order` (objectui#11626)', () => {
  // The renderer sorts every level by `order`. A saved order applied by array
  // position alone was sorted straight back into the app's: stored, never drawn.
  const AUTHORED: NavigationItem[] = [
    {
      id: 'grp_sales',
      type: 'group',
      label: 'Sales',
      children: [
        entry('nav_accounts', 'Accounts', { order: 1 }),
        entry('nav_contacts', 'Contacts', { order: 2 }),
        entry('nav_leads', 'Leads', { order: 3 }),
      ],
    },
  ];

  it('a moved group is drawn in its new order at once and after a reload', () => {
    const first = render(sidebarUi(AUTHORED));
    expect(linkOrder(['Accounts', 'Contacts', 'Leads'])).toEqual(['Accounts', 'Contacts', 'Leads']);

    drop('nav-reorder-group-grp_sales', 'nav_leads', 'nav_accounts');

    expect(stored()).toEqual({ grp_sales: ['nav_leads', 'nav_accounts', 'nav_contacts'] });
    expect(linkOrder(['Accounts', 'Contacts', 'Leads'])).toEqual(['Leads', 'Accounts', 'Contacts']);
    first.unmount();

    render(sidebarUi(AUTHORED));
    expect(linkOrder(['Accounts', 'Contacts', 'Leads'])).toEqual(['Leads', 'Accounts', 'Contacts']);
  });

  it('a move that lands on the listed sequence is still that group’s move, not a top-level one', () => {
    // Listed Alpha, Beta; authored `order` draws Beta first. Dragging Alpha
    // above Beta reports the group as Alpha, Beta: the listed id sequence.
    const navigation: NavigationItem[] = [
      entry('nav_top', 'Top'),
      {
        id: 'grp_ab',
        type: 'group',
        label: 'AB',
        children: [entry('nav_alpha', 'Alpha', { order: 2 }), entry('nav_beta', 'Beta', { order: 1 })],
      },
    ];
    render(sidebarUi(navigation));
    expect(linkOrder(['Alpha', 'Beta'])).toEqual(['Beta', 'Alpha']);

    drop('nav-reorder-group-grp_ab', 'nav_alpha', 'nav_beta');

    expect(stored()).toEqual({ grp_ab: ['nav_alpha', 'nav_beta'] });
    expect(linkOrder(['Alpha', 'Beta'])).toEqual(['Alpha', 'Beta']);
  });
});

describe('UnifiedSidebar — a group-free app’s `__root__` record is unchanged (objectui#11626)', () => {
  const FLAT: NavigationItem[] = [entry('nav_a', 'Alpha'), entry('nav_b', 'Beta'), entry('nav_c', 'Gamma')];

  it('a move stores `__root__` byte-for-byte as before, and a reload applies it', () => {
    const first = render(sidebarUi(FLAT));
    drop('(no id)', 'nav_c', 'nav_a');

    expect(localStorage.getItem(STORE)).toBe('{"__root__":["nav_c","nav_a","nav_b"]}');
    first.unmount();

    render(sidebarUi(FLAT));
    expect(linkOrder(['Alpha', 'Beta', 'Gamma'])).toEqual(['Gamma', 'Alpha', 'Beta']);
  });

  it('a stored `__root__` record written before this change still reads back', () => {
    localStorage.setItem(STORE, '{"__root__":["nav_b","nav_c","nav_a"]}');
    render(sidebarUi(FLAT));
    expect(linkOrder(['Alpha', 'Beta', 'Gamma'])).toEqual(['Beta', 'Gamma', 'Alpha']);
  });

  it('where the app authors `order`, the record is the same and a saved order is now drawn', () => {
    const authored = FLAT.map((item, i) => ({ ...item, order: i + 1 }));
    const first = render(sidebarUi(authored));
    drop('(no id)', 'nav_c', 'nav_a');

    expect(localStorage.getItem(STORE)).toBe('{"__root__":["nav_c","nav_a","nav_b"]}');
    expect(linkOrder(['Alpha', 'Beta', 'Gamma'])).toEqual(['Gamma', 'Alpha', 'Beta']);
    first.unmount();

    render(sidebarUi(authored));
    expect(linkOrder(['Alpha', 'Beta', 'Gamma'])).toEqual(['Gamma', 'Alpha', 'Beta']);
  });
});
