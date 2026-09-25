/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types/zod - Navigation Component Zod Validators
 * 
 * Zod validation schemas for navigation components.
 * Following @objectstack/spec UI specification format.
 * 
 * @module zod/navigation
 * @packageDocumentation
 */

import { z } from 'zod';
import { handlerKeyRefusal, retirementTombstone } from './tombstone.zod.js';
import { BaseSchema, SchemaNodeSchema } from './base.zod.js';
import type { NavLink, NavigationMenuItem } from '../navigation.js';

/**
 * Nav Link Schema
 *
 * INPUT FACE: both type arguments carry this mirror's existing TypeScript
 * declaration (objectui#7760, maintainer ruling, decision batch #69) — the annotation
 * still breaks the recursion in the initializer below, but it no longer publishes
 * `unknown` as what an author may write here. ⛔ Runtime accept set unchanged; ⛔ the
 * declaration unchanged. The reasoning lives once, on `SchemaNodeSchema` in
 * `base.zod.ts` — read it there before changing this line.
 */
export const NavLinkSchema: z.ZodType<NavLink, NavLink> = z.lazy(() =>
  z.object({
    label: z.string().describe('Link label'),
    href: z.string().describe('Link URL'),
    icon: z.string().optional().describe('Link icon'),
    active: z.boolean().optional().describe('Whether link is active'),
    disabled: z.boolean().optional().describe('Whether link is disabled'),
    children: z.array(NavLinkSchema).optional().describe('Sub-navigation items'),
    badge: z.union([z.string(), z.number()]).optional().describe('Badge content'),
  })
);

/**
 * Breadcrumb Item Schema
 */
export const BreadcrumbItemSchema = z.object({
  label: z.string().describe('Breadcrumb label'),
  href: z.string().optional().describe('Link URL'),
  icon: z.string().optional().describe('Breadcrumb icon'),
  onClick: handlerKeyRefusal('onClick', 'retired', 'Click handler'),
  siblings: z.array(z.object({
    label: z.string().describe('Sibling label'),
    href: z.string().describe('Sibling URL'),
  })).optional().describe('Sibling items for dropdown navigation'),
});

/**
 * Header Bar Schema - Header/navigation bar component
 */
export const HeaderBarSchema = BaseSchema.extend({
  type: z.literal('header-bar'),
  title: retirementTombstone(
    'REFUSED (objectui#10387, ADR-0049) — `header-bar` reads no `title`: the key is not in '
    + '`@objectstack/spec`, and its renderer reads only `actions`, `crumbs`, `rightContent`, `search` and '
    + 'the inherited `className` off the node and takes no spread props, so an authored title rendered nothing — '
    + 'no error, no warning, no element. What it renders instead: `actions`, `crumbs`, '
    + '`rightContent`, `search`. For the current page name use the last entry of `crumbs`.',
  ),
  logo: retirementTombstone(
    'REFUSED (objectui#10387, ADR-0049) — `header-bar` reads no `logo`: the key is not in '
    + '`@objectstack/spec`, and its renderer reads only `actions`, `crumbs`, `rightContent`, `search` and '
    + 'the inherited `className` off the node and takes no spread props, so an authored logo (URL or node) rendered nothing — '
    + 'no error, no warning, no element. What it renders instead: `actions`, `crumbs`, '
    + '`rightContent`, `search`. For brand content use `rightContent` or `actions`.',
  ),
  nav: retirementTombstone(
    'REFUSED (objectui#10387, ADR-0049) — `header-bar` reads no `nav`: the key is not in '
    + '`@objectstack/spec`, and its renderer reads only `actions`, `crumbs`, `rightContent`, `search` and '
    + 'the inherited `className` off the node and takes no spread props, so an authored link list rendered nothing — '
    + 'no error, no warning, no element. What it renders instead: `actions`, `crumbs`, '
    + '`rightContent`, `search`. For links use `crumbs`, or a `navigation-menu` / `sidebar` node.',
  ),
  crumbs: z.array(BreadcrumbItemSchema).optional().describe('Breadcrumb items'),
  search: z.object({
    enabled: z.boolean().describe('Whether search is enabled'),
    placeholder: z.string().optional().describe('Search placeholder text'),
    shortcut: z.string().optional().describe('Keyboard shortcut (e.g., "⌘K")'),
  }).optional().describe('Search configuration'),
  actions: z.array(SchemaNodeSchema).optional().describe('Right-side action slots'),
  rightContent: SchemaNodeSchema.optional().describe('Custom right content area'),
  left: retirementTombstone(
    'REFUSED (objectui#10387, ADR-0049) — `header-bar` reads no `left`: the key is not in '
    + '`@objectstack/spec`, and its renderer reads only `actions`, `crumbs`, `rightContent`, `search` and '
    + 'the inherited `className` off the node and takes no spread props, so an authored node rendered nothing — '
    + 'no error, no warning, no element. What it renders instead: `actions`, `crumbs`, '
    + '`rightContent`, `search`. For custom content use `rightContent` or `actions`.',
  ),
  center: retirementTombstone(
    'REFUSED (objectui#10387, ADR-0049) — `header-bar` reads no `center`: the key is not in '
    + '`@objectstack/spec`, and its renderer reads only `actions`, `crumbs`, `rightContent`, `search` and '
    + 'the inherited `className` off the node and takes no spread props, so an authored node rendered nothing — '
    + 'no error, no warning, no element. What it renders instead: `actions`, `crumbs`, '
    + '`rightContent`, `search`. For custom content use `rightContent` or `actions`.',
  ),
  right: retirementTombstone(
    'REFUSED (objectui#10387, ADR-0049) — `header-bar` reads no `right`: the key is not in '
    + '`@objectstack/spec`, and its renderer reads only `actions`, `crumbs`, `rightContent`, `search` and '
    + 'the inherited `className` off the node and takes no spread props, so an authored node rendered nothing — '
    + 'no error, no warning, no element. What it renders instead: `actions`, `crumbs`, '
    + '`rightContent`, `search`. The right side is `actions` (a node list) and `rightContent` (one node).',
  ),
  sticky: retirementTombstone(
    'REFUSED (objectui#10387, ADR-0049) — `header-bar` reads no `sticky`: the key is not in '
    + '`@objectstack/spec`, and its renderer reads only `actions`, `crumbs`, `rightContent`, `search` and '
    + 'the inherited `className` off the node and takes no spread props, so true and false drew the same non-sticky header — '
    + 'no error, no warning, no element. What it renders instead: `actions`, `crumbs`, '
    + '`rightContent`, `search`. To pin the header, make its parent layout sticky.',
  ),
  height: retirementTombstone(
    'REFUSED (objectui#10387, ADR-0049) — `header-bar` reads no `height`: the key is not in '
    + '`@objectstack/spec`, and its renderer reads only `actions`, `crumbs`, `rightContent`, `search` and '
    + 'the inherited `className` off the node and takes no spread props, so every value drew the same default-height header — '
    + 'no error, no warning, no element. What it renders instead: `actions`, `crumbs`, '
    + '`rightContent`, `search`. To change the height, author `className` (e.g. `h-20 sm:h-20`); '
    + 'it is merged after the default `h-14` / `sm:h-16` the renderer sets.',
  ),
  variant: retirementTombstone(
    'REFUSED (objectui#10286, ADR-0049) — `header-bar` reads no `variant`: the key is not in '
    + '`@objectstack/spec`, and its renderer reads only `actions`, `crumbs`, `rightContent`, `search` and '
    + 'the inherited `className` off the node and takes no spread props, so every variant rendered the same header — '
    + 'no error, no warning, no class. What it renders instead: `actions`, `crumbs`, `rightContent`, '
    + '`search`.',
  ),
  body: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `header-bar` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `actions`, `crumbs`, `rightContent`, `search`.',
  ),
  children: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `header-bar` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `actions`, `crumbs`, `rightContent`, `search`.',
  ),
});

/**
 * Sidebar Schema - Sidebar component
 */
export const SidebarSchema = BaseSchema.extend({
  type: z.literal('sidebar'),
  title: z.string().optional().describe('Sidebar title'),
  nav: z.array(NavLinkSchema).optional().describe('Navigation links'),
  content: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Sidebar content'),
  footer: z.union([SchemaNodeSchema, z.array(SchemaNodeSchema)]).optional().describe('Sidebar footer'),
  position: z.enum(['left', 'right']).optional().describe('Sidebar position'),
  collapsible: z.boolean().optional().describe('Whether sidebar is collapsible'),
  defaultCollapsed: z.boolean().optional().describe('Default collapsed state'),
  collapsed: z.boolean().optional().describe('Controlled collapsed state'),
  width: z.union([z.string(), z.number()]).optional().describe('Sidebar width'),
  collapsedWidth: z.union([z.string(), z.number()]).optional().describe('Collapsed width'),
  onCollapsedChange: handlerKeyRefusal('onCollapsedChange', 'retired', 'Collapsed change handler'),
  variant: z.enum(['default', 'bordered', 'floating']).optional().describe('Sidebar variant'),
});

/**
 * Breadcrumb Schema - Breadcrumb navigation
 */
export const BreadcrumbSchema = BaseSchema.extend({
  type: z.literal('breadcrumb'),
  items: z.array(BreadcrumbItemSchema).describe('Breadcrumb items'),
  separator: z.string().optional().describe('Custom separator'),
  maxItems: z.number().optional().describe('Maximum items to display'),
  body: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `breadcrumb` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `className`, `items`, `maxItems`, `separator`.',
  ),
  children: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `breadcrumb` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `className`, `items`, `maxItems`, `separator`.',
  ),
});

/**
 * Pagination Schema - Pagination component
 */
export const PaginationSchema = BaseSchema.extend({
  type: z.literal('pagination'),
  page: z.number().optional().describe('Current page number'),
  totalPages: z.number().describe('Total number of pages'),
  siblings: z.number().optional().describe('Number of sibling pages to show'),
  showFirstLast: z.boolean().optional().describe('Show first/last page buttons'),
  showPrevNext: z.boolean().optional().describe('Show previous/next buttons'),
  onPageChange: handlerKeyRefusal('onPageChange', 'runtime-slot', 'Page change handler'),
  body: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `pagination` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `className`, `currentPage`, `page`, `totalPages`.',
  ),
  children: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `pagination` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `className`, `currentPage`, `page`, `totalPages`.',
  ),
});

/**
 * Navigation Menu Item Schema
 *
 * INPUT FACE: both type arguments carry this mirror's existing TypeScript
 * declaration (objectui#7760, maintainer ruling, decision batch #69) — the annotation
 * still breaks the recursion in the initializer below, but it no longer publishes
 * `unknown` as what an author may write here. ⛔ Runtime accept set unchanged; ⛔ the
 * declaration unchanged. The reasoning lives once, on `SchemaNodeSchema` in
 * `base.zod.ts` — read it there before changing this line.
 */
export const NavigationMenuItemSchema: z.ZodType<NavigationMenuItem, NavigationMenuItem> = z.lazy(() =>
  z.object({
    label: z.string().describe('Menu item label'),
    href: z.string().optional().describe('Link URL'),
    description: z.string().optional().describe('Item description'),
    icon: z.string().optional().describe('Item icon'),
    children: z.array(NavigationMenuItemSchema).optional().describe('Submenu items'),
  })
);

/**
 * Navigation Menu Schema - Navigation menu component
 */
export const NavigationMenuSchema = BaseSchema.extend({
  type: z.literal('navigation-menu'),
  items: z.array(NavigationMenuItemSchema).optional().describe('Menu items'),
  orientation: z.enum(['horizontal', 'vertical']).optional().describe('Menu orientation'),
  body: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `navigation-menu` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `className`, `items`.',
  ),
  children: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `navigation-menu` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `className`, `items`.',
  ),
});

/**
 * Button Group Button Schema
 */
export const ButtonGroupButtonSchema = z.object({
  label: z.string().describe('Button label'),
  variant: z.enum(['default', 'secondary', 'destructive', 'outline', 'ghost', 'link']).optional(),
  size: z.enum(['default', 'sm', 'lg', 'icon']).optional(),
  disabled: z.boolean().optional().describe('Whether button is disabled'),
  onClick: handlerKeyRefusal('onClick', 'retired', 'Click handler'),
  className: z.string().optional().describe('Button class name'),
});

/**
 * Button Group Schema - Button group component
 */
export const ButtonGroupSchema = BaseSchema.extend({
  type: z.literal('button-group'),
  buttons: z.array(ButtonGroupButtonSchema).optional().describe('Group buttons'),
  variant: z.enum(['default', 'secondary', 'destructive', 'outline', 'ghost', 'link']).optional().describe('Button group variant'),
  size: z.enum(['default', 'sm', 'lg', 'icon']).optional().describe('Button group size'),
  body: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `button-group` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `buttons`, `className`, `size`, `variant`.',
  ),
  children: retirementTombstone(
    'REFUSED (objectui#9256, ADR-0049) — `button-group` reads NEITHER content channel: measured with the '
    + 'TypeScript type checker across all 24 registering packages, no renderer read consumes `body` or '
    + '`children` for this node, and `SchemaRenderer` strips both out of the props bag it spreads. An '
    + 'authored value therefore rendered NOTHING — no error, no warning, no element. '
    + 'What it renders instead: `buttons`, `className`, `size`, `variant`.',
  ),
});

/**
 * Navigation Schema Union - All navigation component schemas
 */
export const NavigationSchema = z.discriminatedUnion('type', [
  HeaderBarSchema,
  SidebarSchema,
  BreadcrumbSchema,
  PaginationSchema,
  NavigationMenuSchema,
  ButtonGroupSchema,
]);
