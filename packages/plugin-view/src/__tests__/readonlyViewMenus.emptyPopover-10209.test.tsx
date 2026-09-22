/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A menu's TRIGGER and its ENTRIES must answer the same question —
 * objectui#10209.
 *
 * Both view menus used to guard on whether a CALLBACK was wired while every
 * entry beneath them is *also* gated on `!isReadonly`. On a read-only view
 * (`ObjectView` stamps `readonly: true` on any view with no overlay row behind
 * it, which is every code-defined view) the guard passed and the entries all
 * dropped out:
 *
 *   - `ManageViewsDialog`'s `…` opened a popover with NOTHING in it. In a real
 *     browser that is a 180×10px strip of `bg-popover` under the row, which
 *     reads as a clipped or occluded menu, not as an empty one.
 *   - `ViewTabBar`'s dropdown opened on a leading `role="separator"`, because
 *     each separator stated its own condition rather than asking whether
 *     anything rendered above it.
 *
 * ⚠️ An emptiness assertion has to be written against the RENDERED menu, not
 * against the trigger: `queryByTestId('…-actions-…')` being absent is the fix's
 * shape, but a future regression that re-shows the trigger over an empty
 * content would pass a trigger-only pin. So every case here opens whatever
 * trigger exists and asserts on `role="menu"`'s children.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ManageViewsDialog } from '../ManageViewsDialog';
import { ViewTabBar } from '../ViewTabBar';
import type { ViewTabItem } from '../ViewTabBar';

afterEach(cleanup);

/**
 * The tab `ObjectView` builds for an object whose only view is code-defined:
 * read-only, and the default. Deliberately `isDefault: true` — that is what
 * also removes "Set as default", the last entry `isReadonly` alone leaves.
 */
const SYSTEM_DEFAULT: ViewTabItem = {
  id: 'equipment.all',
  label: '设备台账',
  type: 'grid',
  isDefault: true,
  readonly: true,
  readonlyReason: 'System view — defined in code, read-only.',
};

const SAVED: ViewTabItem = { id: 'equipment.mine', label: 'Mine', type: 'grid' };

/** Open a Radix dropdown trigger — its entries only exist once it is open. */
function openMenu(trigger: HTMLElement) {
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  fireEvent.click(trigger);
}

/** The open menu, or null. */
function openedMenu(): HTMLElement | null {
  return document.querySelector('[role="menu"]');
}

/** The console's prop set: every handler wired EXCEPT `onDuplicate` (#1520). */
function renderDialog(views: ViewTabItem[]) {
  render(
    <ManageViewsDialog
      open
      onOpenChange={vi.fn()}
      views={views}
      activeViewId={views[0]?.id}
      onRename={vi.fn()}
      onDelete={vi.fn()}
      onSetDefault={vi.fn()}
      onSetPinned={vi.fn()}
      onReorder={vi.fn()}
      onAddView={vi.fn()}
      onConfigView={vi.fn()}
    />,
  );
}

describe('ManageViewsDialog — no empty overflow popover (objectui#10209)', () => {
  it('withholds the `…` trigger on a read-only row instead of opening an empty menu', () => {
    renderDialog([SYSTEM_DEFAULT]);
    // The row itself still renders — only its dead affordance is gone.
    expect(screen.getByTestId(`manage-views-row-${SYSTEM_DEFAULT.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`manage-views-actions-${SYSTEM_DEFAULT.id}`)).toBeNull();
    // And nothing else in the dialog opens a menu that would be empty.
    expect(openedMenu()).toBeNull();
  });

  it('keeps the lock, and the lock carries the reason (the row\'s only remaining explanation)', () => {
    renderDialog([SYSTEM_DEFAULT]);
    expect(screen.getByTestId(`manage-views-readonly-${SYSTEM_DEFAULT.id}`)).toBeInTheDocument();
  });

  it('a MUTABLE row still opens a populated menu', () => {
    renderDialog([SAVED]);
    const trigger = screen.getByTestId(`manage-views-actions-${SAVED.id}`);
    openMenu(trigger);
    const menu = openedMenu();
    expect(menu).not.toBeNull();
    expect(menu!.querySelectorAll('[role="menuitem"]').length).toBeGreaterThan(0);
    // The delete separator only exists because entries precede it.
    expect(screen.getByTestId(`manage-views-action-delete-${SAVED.id}`)).toBeInTheDocument();
  });

  it('Rename is offered only when the host wired `onRename` — the commit path it needs', () => {
    // `onCommitRename` reaches `onRename?.(…)`, so without that prop the entry
    // starts an edit nothing can save. Every other row action already only
    // renders when its handler exists; rename read `!isReadonly` alone, which
    // is also what let the trigger count it as an entry that would survive.
    render(
      <ManageViewsDialog
        open
        onOpenChange={vi.fn()}
        views={[SAVED]}
        activeViewId={SAVED.id}
      />,
    );
    expect(screen.queryByTestId(`manage-views-actions-${SAVED.id}`)).toBeNull();
    expect(openedMenu()).toBeNull();
  });

  it('a read-only row DOES keep its menu when Duplicate is wired — the one entry `readonly` allows', () => {
    render(
      <ManageViewsDialog
        open
        onOpenChange={vi.fn()}
        views={[SYSTEM_DEFAULT]}
        activeViewId={SYSTEM_DEFAULT.id}
        onDelete={vi.fn()}
        onSetDefault={vi.fn()}
        onConfigView={vi.fn()}
        onDuplicate={vi.fn()}
      />,
    );
    const trigger = screen.getByTestId(`manage-views-actions-${SYSTEM_DEFAULT.id}`);
    openMenu(trigger);
    const menu = openedMenu()!;
    expect(menu.querySelectorAll('[role="menuitem"]').length).toBe(1);
    expect(screen.getByTestId(`manage-views-action-duplicate-${SYSTEM_DEFAULT.id}`)).toBeInTheDocument();
    // Duplicate is the FIRST entry, so nothing separates it from the top edge.
    expect(menu.querySelectorAll('[role="separator"]').length).toBe(0);
  });
});

describe('ViewTabBar — no leading separator, no empty dropdown (objectui#10209)', () => {
  /** Every console handler wired, plus `onManageViews`. */
  function renderBar(views: ViewTabItem[], extra: Record<string, unknown> = {}) {
    render(
      <ViewTabBar
        views={views}
        activeViewId={views[0]!.id}
        onViewChange={vi.fn()}
        onRenameView={vi.fn()}
        onDeleteView={vi.fn()}
        onPinView={vi.fn()}
        onSetDefaultView={vi.fn()}
        onConfigView={vi.fn()}
        onManageViews={vi.fn()}
        config={{ reorderable: false, showAddButton: true }}
        {...extra}
      />,
    );
    return screen.getByLabelText(`View actions for ${views[0]!.label}`);
  }

  it('a read-only tab opens on "Manage all views…" alone — no rule above it', () => {
    openMenu(renderBar([SYSTEM_DEFAULT]));
    const menu = openedMenu()!;
    expect(menu.querySelectorAll('[role="menuitem"]').length).toBe(1);
    expect(screen.getByTestId(`view-tab-menu-manage-${SYSTEM_DEFAULT.id}`)).toBeInTheDocument();
    expect(menu.querySelectorAll('[role="separator"]').length).toBe(0);
  });

  it('a MUTABLE tab keeps the separators that now have entries above them', () => {
    openMenu(renderBar([SAVED]));
    const menu = openedMenu()!;
    expect(menu.querySelectorAll('[role="menuitem"]').length).toBeGreaterThan(1);
    // Delete and Manage each sit below a rule, and both rules earn their place.
    expect(menu.querySelectorAll('[role="separator"]').length).toBe(2);
    expect(screen.getByTestId(`view-tab-menu-delete-${SAVED.id}`)).toBeInTheDocument();
  });

  it('withholds the tab trigger entirely when even "Manage all views…" is unwired', () => {
    render(
      <ViewTabBar
        views={[SYSTEM_DEFAULT]}
        activeViewId={SYSTEM_DEFAULT.id}
        onViewChange={vi.fn()}
        onRenameView={vi.fn()}
        onDeleteView={vi.fn()}
        onConfigView={vi.fn()}
        config={{ reorderable: false, showAddButton: false }}
      />,
    );
    expect(screen.queryByTestId(`view-tab-actions-${SYSTEM_DEFAULT.id}`)).toBeNull();
    expect(openedMenu()).toBeNull();
  });

  it('the right-click context menu drops its leading rule on a read-only tab too', () => {
    renderBar([SYSTEM_DEFAULT], { config: { reorderable: false, showAddButton: true, enableContextMenu: true } });
    fireEvent.contextMenu(screen.getByTestId(`view-tab-${SYSTEM_DEFAULT.id}`));
    const menu = document.querySelector('[role="menu"]') as HTMLElement | null;
    expect(menu).not.toBeNull();
    expect(menu!.querySelectorAll('[role="menuitem"]').length).toBe(1);
    expect(menu!.querySelectorAll('[role="separator"]').length).toBe(0);
  });
});
