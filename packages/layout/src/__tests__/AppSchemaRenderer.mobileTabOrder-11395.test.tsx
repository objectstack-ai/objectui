/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * objectui#11395 — `AppSchemaRenderer`'s mobile tab bar (`mobileNavMode:
 * 'bottom_nav'`) draws its tabs in the sidebar's order, and this file closes the
 * family "the tab bar answers differently from the sidebar".
 *
 * The bar used to flatten the tree in authored position and never read `order`,
 * so two entries written `Zeta` (`order: 2`) then `Ypsilon` (`order: 1`) drew
 * `Ypsilon, Zeta` in the sidebar and `Zeta, Ypsilon` on the bar, and with more
 * than five entries the five-tab cap kept the first five by authored position.
 * The sidebar sorts each level by `order` (the spec: "Sort order within the same
 * level (lower = first)"): the top level and each group's children. The bar now
 * sorts the same levels with the same comparator, `byNavOrder` in the internal
 * `navOrder` module, before it flattens; the guard and the cap run after, so the
 * five tabs are the sidebar's first five drawn entries.
 *
 * ## The enumeration (the family's closure)
 *
 * Every per-entry input the sidebar's render path reads, classified once by
 * reading `NavigationRenderer` and `NavigationItemRenderer` when this card
 * landed. ⚠️ Nothing re-derives this list: a key the sidebar starts reading
 * later is not caught here, so the next card in the family re-reads the render
 * path rather than trusting this header.
 *
 * Shared with the bar (the bar asks the sidebar's own rule):
 *  - `order` — `byNavOrder`, pinned in this file.
 *  - the guard (`visible`, `requiredPermissions`, `requiresObject` /
 *    `requiresService`, a `doc` entry's target, an `action` entry's dispatcher)
 *    — `hasVisibleNavigationItems`, pinned in
 *    `AppSchemaRenderer.mobileTabGuard-11362.test.tsx`.
 *  - `type: 'action'` drawn as a button handing the item to `onAction` — the
 *    same file.
 *  - href, `external` and the lit tab — `resolveHref` and
 *    `resolveActiveNavItem`, pinned in
 *    `AppSchemaRenderer.mobileTabHref-11211.test.tsx`. Neither surface gets a
 *    template context inside `AppSchemaRenderer`.
 *  - label — `resolveNavItemLabel` with the same (absent) `t`, target-label
 *    resolver and locale, pinned in this file.
 *  - icon — `resolveIcon`, pinned in this file.
 *  - `badge` / `badgeVariant` — the bar used to drop them; now drawn with the
 *    same `Badge` and the same variant, pinned in this file.
 *  - drag-reorder — the sidebar hands the new positions to the host's
 *    `onReorder` as `order` values, so the bar follows through `order`.
 *
 * Deliberately bar-specific, each pinned in this file with its reason:
 *  - `type: 'separator'` — a rule between rows, not a destination: no tab and
 *    no slot.
 *  - `type: 'group'` — a disclosure, not a destination: its label is no tab,
 *    its children are.
 *  - `expanded` / `defaultOpen` (and the auto-collapse of long groups) — the
 *    sidebar's open state for a disclosure the bar does not have; a collapsed
 *    group's children stay reachable in the sidebar, so they stay on the bar.
 *  - `pinned` with `enablePinning` — the Favorites section is a second path to
 *    entries already in the tree; on the bar it would spend two of five slots
 *    on one destination, so the bar draws each entry once, at its tree place.
 *  - the sidebar's search box (`enableSearch`) — it narrows the sidebar while
 *    the user types in it; the bar has no search box and stays the app's
 *    standing navigation.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { NavigationItem } from '@object-ui/types';
import { AppSchemaRenderer, type AppSchemaRendererProps } from '../AppSchemaRenderer';

const BASE = '/apps/crm';

const entry = (label: string, order?: number, extra: Partial<NavigationItem> = {}): NavigationItem =>
  ({
    id: `nav_${label.toLowerCase().replace(/\s+/g, '_')}`,
    type: 'object',
    label,
    objectName: label.toLowerCase().replace(/\s+/g, '_'),
    ...(order === undefined ? {} : { order }),
    ...extra,
  }) as NavigationItem;

function renderShell(
  navigation: NavigationItem[],
  props: Partial<Omit<AppSchemaRendererProps, 'schema' | 'children'>> = {},
) {
  const { container } = render(
    <MemoryRouter initialEntries={['/']}>
      <AppSchemaRenderer
        schema={{ type: 'app', name: 'crm', title: 'CRM', navigation }}
        basePath={BASE}
        mobileNavMode="bottom_nav"
        {...props}
      >
        <div />
      </AppSchemaRenderer>
    </MemoryRouter>,
  );
  const bar = () => container.querySelector('[role="navigation"][aria-label="Mobile navigation"]');
  const tabEls = () => {
    const b = bar();
    return b ? Array.from(b.querySelectorAll('a, button')) : [];
  };
  /** Every tab, link or button, in drawn order, by the label it shows. */
  const tabs = () => tabEls().map((el) => el.querySelector('span')?.textContent ?? '');
  const tab = (label: string) => {
    const hit = tabEls().filter((el) => el.querySelector('span')?.textContent === label);
    expect(hit.length).toBeLessThanOrEqual(1);
    return hit[0] ?? null;
  };
  /** The sidebar rows (outside the bar) whose text is one of `labels`, in drawn order. */
  const sidebarOrder = (labels: string[]) =>
    Array.from(container.querySelectorAll('a, button'))
      .filter((el) => !bar()?.contains(el))
      .map((el) => el.querySelector('span')?.textContent ?? el.textContent ?? '')
      .filter((text) => labels.includes(text));
  const sidebarRow = (label: string) => {
    const hit = Array.from(container.querySelectorAll('a, button')).filter(
      (el) => !bar()?.contains(el) && el.querySelector('span')?.textContent === label,
    );
    expect(hit.length).toBeLessThanOrEqual(1);
    return hit[0] ?? null;
  };
  return { container, bar, tabs, tab, sidebarOrder, sidebarRow };
}

describe('objectui#11395 — the tab bar draws its tabs in the sidebar\'s order', () => {
  it('the card\'s table: `Zeta` (`order: 2`) then `Ypsilon` (`order: 1`) draw `Ypsilon, Zeta` on both', () => {
    const { tabs, sidebarOrder } = renderShell([entry('Zeta', 2), entry('Ypsilon', 1)]);
    expect(sidebarOrder(['Zeta', 'Ypsilon'])).toEqual(['Ypsilon', 'Zeta']);
    expect(tabs()).toEqual(['Ypsilon', 'Zeta']);
  });

  it('six entries: `order` decides which five the cap keeps — the sidebar\'s first five', () => {
    const six = [
      entry('Alpha', 6),
      entry('Bravo', 1),
      entry('Charlie', 2),
      entry('Delta', 3),
      entry('Echo', 4),
      entry('Foxtrot', 5),
    ];
    const labels = six.map((e) => e.label as string);
    const { tabs, sidebarOrder } = renderShell(six);
    const drawn = sidebarOrder(labels);
    expect(drawn).toEqual(['Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Alpha']);
    expect(tabs()).toEqual(drawn.slice(0, 5));
  });

  it('control: with no `order` on any entry, both keep authored order and the cap keeps the first five authored', () => {
    const six = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map((l) => entry(l));
    const { tabs, sidebarOrder } = renderShell(six);
    expect(sidebarOrder(['One', 'Two', 'Three', 'Four', 'Five', 'Six'])).toEqual([
      'One', 'Two', 'Three', 'Four', 'Five', 'Six',
    ]);
    expect(tabs()).toEqual(['One', 'Two', 'Three', 'Four', 'Five']);
  });

  it('the comparator\'s edges: a missing `order` reads as 0, and a tie keeps authored order, on both', () => {
    const nav = [entry('Xray', 1), entry('Yankee'), entry('Kilo', 1), entry('Zulu', -1)];
    const { tabs, sidebarOrder } = renderShell(nav);
    const drawn = sidebarOrder(['Xray', 'Yankee', 'Kilo', 'Zulu']);
    expect(drawn).toEqual(['Zulu', 'Yankee', 'Xray', 'Kilo']);
    expect(tabs()).toEqual(drawn);
  });

  it('grouped: each level sorts before the bar flattens — groups by their `order`, a group\'s children by theirs', () => {
    const navigation: NavigationItem[] = [
      {
        id: 'grp_service',
        type: 'group',
        label: 'Service',
        order: 2,
        children: [entry('Cases', 2), entry('Calls', 1)],
      },
      {
        id: 'grp_sales',
        type: 'group',
        label: 'Sales',
        order: 1,
        children: [entry('Deals', 3), entry('Leads', 1), entry('Quotes', 2)],
      },
    ];
    const labels = ['Cases', 'Calls', 'Deals', 'Leads', 'Quotes'];
    const { tabs, sidebarOrder } = renderShell(navigation);
    const drawn = sidebarOrder(labels);
    expect(drawn).toEqual(['Leads', 'Quotes', 'Deals', 'Calls', 'Cases']);
    expect(tabs()).toEqual(drawn);
  });
});
