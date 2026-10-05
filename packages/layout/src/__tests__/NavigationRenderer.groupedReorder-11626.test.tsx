/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11626 — drag-to-reorder works on a GROUPED menu, within a level.
 *
 * Before: `NavigationRenderer` mounted its sortable path only when the menu
 * had no groups, so on every stock app (all grouped) `enableReorder` drew no
 * grip at all. Triage's direction (`5986793209`): each group's children get the
 * same sortable path, scoped to that group, and the move is reported through
 * the existing `onReorder(reorderedItems)` with no signature change. A move
 * into another group is out of scope: which group an entry sits in is the
 * app's structure, not a personal order.
 *
 * ── The instrument ────────────────────────────────────────────────────────
 * The one `plugin-kanban` uses (`sameColumnDropIsNotClaimed-8826.test.tsx`):
 * a module mock of `@dnd-kit/core` that renders the REAL `DndContext` and
 * records the `onDragEnd` it was handed, keyed by the context's `id` (the
 * group-free arm's context has none). dnd-kit's sensors need layout that
 * happy-dom does not have, so a synthesized drop on the production handler is
 * the closest honest reproduction; everything after that call is the real
 * path. The live drag in a browser is measured on the pull request.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { NavigationItem } from '@object-ui/types';
import { SidebarProvider } from '@object-ui/components';
import { NavigationRenderer } from '../NavigationRenderer';

type DragEnd = (event: { active: { id: string }; over: { id: string } | null }) => void;

// `vi.hoisted` so the hoisted mock factory can reach the box.
const dnd = vi.hoisted(() => ({ byContext: new Map<string, DragEnd>() }));

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  const ReactMod = await import('react');
  const CapturingDndContext = (props: Record<string, unknown>) => {
    dnd.byContext.set(String(props.id ?? '(no id)'), props.onDragEnd as DragEnd);
    return ReactMod.createElement(actual.DndContext, props as never);
  };
  return { ...actual, DndContext: CapturingDndContext };
});

const BASE = '/apps/crm';
const GRIP = '[aria-label="Drag to reorder"]';

const leaf = (id: string, extra: Partial<NavigationItem> = {}): NavigationItem =>
  ({ id, type: 'object', objectName: id, label: id.toUpperCase(), ...extra }) as NavigationItem;

/** Two top-level entries, then two groups — the shape of the stock showcase. */
const GROUPED: NavigationItem[] = [
  leaf('t1'),
  leaf('t2'),
  { id: 'grp_a', type: 'group', label: 'Group A', children: [leaf('a1'), leaf('a2'), leaf('a3')] },
  { id: 'grp_b', type: 'group', label: 'Group B', children: [leaf('b1'), leaf('b2')] },
];

function renderNav(items: NavigationItem[], props: Record<string, unknown> = {}) {
  return render(
    <MemoryRouter initialEntries={[BASE]}>
      <SidebarProvider defaultOpen>
        <NavigationRenderer items={items} basePath={BASE} {...props} />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

function drop(contextId: string, activeId: string, overId: string) {
  const onDragEnd = dnd.byContext.get(contextId);
  expect(onDragEnd, `a DndContext with id ${contextId} was mounted`).toBeTypeOf('function');
  act(() => onDragEnd!({ active: { id: activeId }, over: { id: overId } }));
}

const ids = (items: NavigationItem[] | undefined) => (items ?? []).map((i) => i.id);
const orders = (items: NavigationItem[] | undefined) => (items ?? []).map((i) => i.order);
const childrenOf = (items: NavigationItem[], groupId: string) =>
  items.find((i) => i.id === groupId)?.children;

beforeEach(() => {
  dnd.byContext.clear();
});

describe('objectui#11626 — a grouped menu offers drag-to-reorder within each level', () => {
  it('draws a grip on every entry of a grouped menu, and none with reorder off', () => {
    const on = renderNav(GROUPED, { enableReorder: true, onReorder: vi.fn() });
    // t1, t2, a1–a3, b1–b2: seven entries, seven grips; a group header has none.
    expect(on.container.querySelectorAll(GRIP)).toHaveLength(7);
    on.unmount();

    const off = renderNav(GROUPED, { onReorder: vi.fn() });
    expect(off.container.querySelectorAll(GRIP)).toHaveLength(0);
  });

  it('each group, and each run of top-level entries, is a sortable list of its own', () => {
    renderNav(GROUPED, { enableReorder: true, onReorder: vi.fn() });
    expect([...dnd.byContext.keys()].sort()).toEqual([
      'nav-reorder-group-grp_a',
      'nav-reorder-group-grp_b',
      'nav-reorder-top-t1',
    ]);
  });

  it('a move within a group reports the top-level list with that group’s children reordered', () => {
    const onReorder = vi.fn();
    renderNav(GROUPED, { enableReorder: true, onReorder });

    drop('nav-reorder-group-grp_a', 'a3', 'a1');

    expect(onReorder).toHaveBeenCalledTimes(1);
    const reported: NavigationItem[] = onReorder.mock.calls[0][0];
    // The top level is reported whole and as drawn.
    expect(ids(reported)).toEqual(['t1', 't2', 'grp_a', 'grp_b']);
    // The moved group: new order, positions carried as `order`.
    expect(ids(childrenOf(reported, 'grp_a'))).toEqual(['a3', 'a1', 'a2']);
    expect(orders(childrenOf(reported, 'grp_a'))).toEqual([0, 1, 2]);
    // The other group and the top level are not restamped.
    expect(ids(childrenOf(reported, 'grp_b'))).toEqual(['b1', 'b2']);
    expect(orders(childrenOf(reported, 'grp_b'))).toEqual([undefined, undefined]);
    expect(orders(reported)).toEqual([undefined, undefined, undefined, undefined]);
  });

  it('an entry of another group is no drop target: a cross-group drop reports nothing', () => {
    const onReorder = vi.fn();
    renderNav(GROUPED, { enableReorder: true, onReorder });

    drop('nav-reorder-group-grp_a', 'a1', 'b1');
    drop('nav-reorder-group-grp_b', 'b2', 't1');
    drop('nav-reorder-top-t1', 't2', 'a1');

    expect(onReorder).not.toHaveBeenCalled();
    // Lit control: the same context does report a drop within its own group.
    drop('nav-reorder-group-grp_a', 'a2', 'a1');
    expect(onReorder).toHaveBeenCalledTimes(1);
  });

  it('a move among the top-level entries of a grouped menu reorders the top level, groups in place', () => {
    const onReorder = vi.fn();
    renderNav(GROUPED, { enableReorder: true, onReorder });

    drop('nav-reorder-top-t1', 't2', 't1');

    const reported: NavigationItem[] = onReorder.mock.calls[0][0];
    expect(ids(reported)).toEqual(['t2', 't1', 'grp_a', 'grp_b']);
    expect(orders(reported)).toEqual([0, 1, 2, 3]);
    expect(ids(childrenOf(reported, 'grp_a'))).toEqual(['a1', 'a2', 'a3']);
  });

  it('a gated-away child gets no drag wrapper, keeps its place, and is not dropped from the report', () => {
    const onReorder = vi.fn();
    const items: NavigationItem[] = [
      {
        id: 'grp_a',
        type: 'group',
        label: 'Group A',
        children: [leaf('a1'), leaf('hidden', { visible: false } as Partial<NavigationItem>), leaf('a2')],
      },
    ];
    const { container } = renderNav(items, {
      enableReorder: true,
      onReorder,
      evaluateVisibility: (expr: unknown) => expr !== false,
    });
    // The sortable wrappers are the group menu's direct children: one per drawn
    // entry, and none left empty by the gated-away one.
    const wrappers = [...container.querySelectorAll('[data-sidebar="menu"] > div')];
    expect(wrappers).toHaveLength(2);
    expect(wrappers.every((w) => w.childElementCount > 0)).toBe(true);

    drop('nav-reorder-group-grp_a', 'a2', 'a1');

    const reported: NavigationItem[] = onReorder.mock.calls[0][0];
    expect(ids(childrenOf(reported, 'grp_a'))).toEqual(['a2', 'a1', 'hidden']);
  });

  it('a nested group is a level of its own; its move is reported at its depth', () => {
    const onReorder = vi.fn();
    const items: NavigationItem[] = [
      {
        id: 'grp_outer',
        type: 'group',
        label: 'Outer',
        children: [
          leaf('o1'),
          { id: 'grp_inner', type: 'group', label: 'Inner', children: [leaf('i1'), leaf('i2')] },
        ],
      },
    ];
    renderNav(items, { enableReorder: true, onReorder });

    drop('nav-reorder-group-grp_inner', 'i2', 'i1');

    const reported: NavigationItem[] = onReorder.mock.calls[0][0];
    const outer = childrenOf(reported, 'grp_outer');
    expect(ids(outer)).toEqual(['o1', 'grp_inner']);
    expect(ids(childrenOf(outer!, 'grp_inner'))).toEqual(['i2', 'i1']);
  });

  it('a row inside a sortable group still lights for the current route, and opens its group', () => {
    const { container } = render(
      <MemoryRouter initialEntries={[`${BASE}/a2`]}>
        <SidebarProvider defaultOpen>
          <NavigationRenderer items={GROUPED} basePath={BASE} enableReorder onReorder={vi.fn()} />
        </SidebarProvider>
      </MemoryRouter>,
    );
    const lit = [...container.querySelectorAll('[data-sidebar="menu-button"][data-active="true"]')];
    expect(lit.map((el) => el.textContent)).toEqual(['A2']);
    // The lit row sits in a sortable row: its grip is drawn beside it.
    expect(lit[0].closest('[data-sidebar="menu-item"]')?.querySelector(GRIP)).not.toBeNull();
  });

  it('while a search narrows a grouped menu, it offers no grip', () => {
    const { container } = renderNav(GROUPED, { enableReorder: true, onReorder: vi.fn(), searchQuery: 'a' });
    // Control: the search matched entries, so rows are drawn.
    expect(container.querySelectorAll('a[href]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll(GRIP)).toHaveLength(0);
    expect(dnd.byContext.size).toBe(0);
  });
});

describe('objectui#11626 — the grip is the one drag activator a keyboard can reach', () => {
  const FLAT: NavigationItem[] = [leaf('f1'), leaf('f2'), leaf('f3')];

  it.each([
    ['grouped', GROUPED, 7],
    ['group-free', FLAT, 3],
  ] as const)('%s menu: each grip is a focusable sortable button; no row wrapper is', (_shape, items, rows) => {
    const { container } = renderNav(items as NavigationItem[], { enableReorder: true, onReorder: vi.fn() });
    const grips = [...container.querySelectorAll(GRIP)];
    expect(grips).toHaveLength(rows);
    for (const grip of grips) {
      expect(grip.getAttribute('role')).toBe('button');
      expect(grip.getAttribute('tabindex')).toBe('0');
      expect(grip.getAttribute('aria-roledescription')).toBe('sortable');
    }
    // The sortable description sits on the grips and nowhere else: a row
    // wrapper carrying it was a focusable "button" no key could drag from.
    expect(container.querySelectorAll('[aria-roledescription="sortable"]')).toHaveLength(rows);
    const wrappers = [...container.querySelectorAll('[data-sidebar="menu"] > div')];
    expect(wrappers).toHaveLength(rows);
    for (const wrapper of wrappers) {
      expect(wrapper.hasAttribute('tabindex')).toBe(false);
      expect(wrapper.hasAttribute('role')).toBe(false);
    }
  });
});

describe('objectui#11626 — the group-free menu is unchanged', () => {
  const FLAT: NavigationItem[] = [leaf('f1'), leaf('f2'), leaf('f3')];

  it('keeps its one context and reports the whole level moved, positions as `order`', () => {
    const onReorder = vi.fn();
    const { container } = renderNav(FLAT, { enableReorder: true, onReorder });
    expect(container.querySelectorAll(GRIP)).toHaveLength(3);
    expect([...dnd.byContext.keys()]).toEqual(['(no id)']);

    drop('(no id)', 'f3', 'f1');

    const reported: NavigationItem[] = onReorder.mock.calls[0][0];
    expect(ids(reported)).toEqual(['f3', 'f1', 'f2']);
    expect(orders(reported)).toEqual([0, 1, 2]);
  });
});
