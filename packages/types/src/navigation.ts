/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @object-ui/types - Navigation Component Schemas
 * 
 * Type definitions for navigation and menu components.
 * 
 * @module navigation
 * @packageDocumentation
 */

import type { BaseSchema, SchemaNode } from './base.js';

/**
 * Navigation link
 */
export interface NavLink {
  /**
   * Link label
   */
  label: string;
  /**
   * Link URL/href
   */
  href: string;
  /**
   * Link icon
   */
  icon?: string;
  /**
   * Whether link is active
   */
  active?: boolean;
  /**
   * Whether link is disabled
   */
  disabled?: boolean;
  /**
   * Submenu links
   */
  children?: NavLink[];
  /**
   * Badge content
   */
  badge?: string | number;
}

/**
 * Header bar component
 */
export interface HeaderBarSchema extends BaseSchema {
  type: 'header-bar';
  /**
   * Header title/brand
   */
  title?: string;
  /**
   * Brand logo image URL
   */
  logo?: string;
  /**
   * Navigation links
   */
  nav?: NavLink[];
  /**
   * Breadcrumb items
   */
  crumbs?: BreadcrumbItem[];
  /**
   * Search configuration
   */
  search?: { enabled: boolean; placeholder?: string; shortcut?: string };
  /**
   * Right-side action slots
   */
  actions?: SchemaNode[];
  /**
   * Custom right content area
   */
  rightContent?: SchemaNode;
  /**
   * Left side content
   */
  left?: SchemaNode | SchemaNode[];
  /**
   * Center content
   */
  center?: SchemaNode | SchemaNode[];
  /**
   * Right side content
   */
  right?: SchemaNode | SchemaNode[];
  /**
   * Whether header is sticky
   * @default true
   */
  sticky?: boolean;
  /**
   * Header height
   */
  height?: string | number;
  /**
   * Header variant
   * @default 'default'
   */
  variant?: 'default' | 'bordered' | 'floating';
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `header-bar` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `actions`, `crumbs`, `rightContent`, `search` (in
   * `packages/components/src/renderers/navigation/header-bar.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `header-bar` reads — nothing renders it.
   */
  body?: never;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `header-bar` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `actions`, `crumbs`, `rightContent`, `search` (in
   * `packages/components/src/renderers/navigation/header-bar.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `header-bar` reads — nothing renders it.
   */
  children?: never;
}

/**
 * Sidebar component
 */
export interface SidebarSchema extends BaseSchema {
  type: 'sidebar';
  /**
   * Sidebar title
   */
  title?: string;
  /**
   * Navigation links
   */
  nav?: NavLink[];
  /**
   * Sidebar content (alternative to nav)
   */
  content?: SchemaNode | SchemaNode[];
  /**
   * Footer content
   */
  footer?: SchemaNode | SchemaNode[];
  /**
   * Sidebar position
   * @default 'left'
   */
  position?: 'left' | 'right';
  /**
   * Whether sidebar is collapsible
   * @default true
   */
  collapsible?: boolean;
  /**
   * Default collapsed state
   * @default false
   */
  defaultCollapsed?: boolean;
  /**
   * Controlled collapsed state
   */
  collapsed?: boolean;
  /**
   * Sidebar width when expanded
   * @default '16rem'
   */
  width?: string | number;
  /**
   * Sidebar width when collapsed
   * @default '4rem'
   */
  collapsedWidth?: string | number;
  /**
   * RETIRED (objectui#6124, ADR-0049) — JSON has no function value, and the
   * `sidebar` renderer spreads it onto `<Sidebar>`, which has no such prop
   * (React attaches nothing). The zod twin refuses it by name; author behaviour
   * as a node type (`{ "type": "toast" }`, an `action:button` node) instead.
   * @deprecated Not part of this contract — the value was inert.
   */
  onCollapsedChange?: never;
  /**
   * Sidebar variant
   * @default 'default'
   */
  variant?: 'default' | 'bordered' | 'floating';
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  /**
   * Item label
   */
  label: string;
  /**
   * Item URL/href
   */
  href?: string;
  /**
   * Item icon
   */
  icon?: string;
  /**
   * RETIRED (objectui#6124, ADR-0049) — JSON has no function value, and the
   * `breadcrumb` renderer renders items as links and never reads it. The zod
   * twin refuses it by name; author behaviour as a node type (`{ "type":
   * "toast" }`, an `action:button` node) instead.
   * @deprecated Not part of this contract — the value was inert.
   */
  onClick?: never;
  /**
   * Sibling items for dropdown navigation (e.g., quick-switch between objects)
   */
  siblings?: Array<{ label: string; href: string }>;
}

/**
 * Breadcrumb component
 */
export interface BreadcrumbSchema extends BaseSchema {
  type: 'breadcrumb';
  /**
   * Breadcrumb items
   */
  items: BreadcrumbItem[];
  /**
   * Separator character/icon
   * @default '/'
   */
  separator?: string;
  /**
   * Maximum items to display before collapsing
   */
  maxItems?: number;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `breadcrumb` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `className`, `items`, `maxItems`, `separator` (in
   * `packages/components/src/renderers/data-display/breadcrumb.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `breadcrumb` reads — nothing renders it.
   */
  body?: never;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `breadcrumb` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `className`, `items`, `maxItems`, `separator` (in
   * `packages/components/src/renderers/data-display/breadcrumb.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `breadcrumb` reads — nothing renders it.
   */
  children?: never;
}

/**
 * Pagination component
 */
export interface PaginationSchema extends BaseSchema {
  type: 'pagination';
  /**
   * Current page (1-indexed)
   */
  currentPage?: number;
  /**
   * Legacy page property
   */
  page?: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Number of sibling pages to show
   * @default 1
   */
  siblings?: number;
  /**
   * Show first/last buttons
   * @default true
   */
  showFirstLast?: boolean;
  /**
   * Show previous/next buttons
   * @default true
   */
  showPrevNext?: boolean;
  /**
   * Page change handler
   *
   * RUNTIME SLOT (objectui#6124) — a host-supplied function, NOT authorable
   * metadata: JSON has no function value, so the zod twin refuses this key by
   * name and points at the node-type spelling. Kept callable here because it is
   * called by the `pagination` renderer as `props.onPageChange(page)` after
   * `SchemaRenderer` spreads it.
   */
  onPageChange?: (page: number) => void;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `pagination` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `className`, `currentPage`, `page`, `totalPages` (in
   * `packages/components/src/renderers/basic/pagination.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `pagination` reads — nothing renders it.
   */
  body?: never;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `pagination` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `className`, `currentPage`, `page`, `totalPages` (in
   * `packages/components/src/renderers/basic/pagination.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `pagination` reads — nothing renders it.
   */
  children?: never;
}

/**
 * Navigation menu item
 */
export interface NavigationMenuItem {
  /**
   * Item label
   */
  label: string;
  /**
   * Item href/link
   */
  href?: string;
  /**
   * Item description
   */
  description?: string;
  /**
   * Item icon
   */
  icon?: string;
  /**
   * Child items
   */
  children?: NavigationMenuItem[];
}

/**
 * Navigation menu component
 */
export interface NavigationMenuSchema extends BaseSchema {
  type: 'navigation-menu';
  /**
   * Navigation menu items
   */
  items?: NavigationMenuItem[];
  /**
   * Navigation menu orientation
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `navigation-menu` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `className`, `items` (in
   * `packages/components/src/renderers/basic/navigation-menu.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `navigation-menu` reads — nothing renders it.
   */
  body?: never;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `navigation-menu` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `className`, `items` (in
   * `packages/components/src/renderers/basic/navigation-menu.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `navigation-menu` reads — nothing renders it.
   */
  children?: never;
}

/**
 * Button group button
 */
export interface ButtonGroupButton {
  /**
   * Button label
   */
  label: string;
  /**
   * Button variant
   */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  /**
   * Button size
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Whether button is disabled
   */
  disabled?: boolean;
  /**
   * RETIRED (objectui#6124, ADR-0049) — JSON has no function value, and the
   * `button-group` renderer renders each `<Button>` without a click handler and
   * never reads it. The zod twin refuses it by name; author behaviour as a node
   * type (`{ "type": "toast" }`, an `action:button` node) instead.
   * @deprecated Not part of this contract — the value was inert.
   */
  onClick?: never;
  /**
   * Button CSS class
   */
  className?: string;
}

/**
 * Button group component
 */
export interface ButtonGroupSchema extends BaseSchema {
  type: 'button-group';
  /**
   * Button group buttons
   */
  buttons?: ButtonGroupButton[];
  /**
   * Default button variant
   * @default 'default'
   */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  /**
   * Default button size
   * @default 'default'
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `button-group` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `buttons`, `className`, `size`, `variant` (in
   * `packages/components/src/renderers/basic/button-group.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `button-group` reads — nothing renders it.
   */
  body?: never;
  /**
   * REFUSED BY NAME (objectui#9256, ADR-0049) — `button-group` reads NEITHER
   * content channel: no renderer read consumes `body` or `children` for this
   * node.
   *
   * MEASURED with the TypeScript TYPE CHECKER and not with grep, across all 24
   * packages that register components plus the generic traversers — a docblock
   * mention is not a read, and `body: schema.requestBody` in
   * `packages/plugin-chatbot/src/renderer.tsx` is the kind of prefix hit grep
   * scores. Every read is filed under the TYPE of the object it is read from;
   * this declaration carries none. What the renderer DOES read off this node:
   * `buttons`, `className`, `size`, `variant` (in
   * `packages/components/src/renderers/basic/button-group.tsx`).
   *
   * `body` and `children` are inherited-and-optional from {@link BaseSchema},
   * whose own docblock admits "some components use `children` instead of
   * `body`" without saying which — so authoring either here type-checked,
   * parsed green through `.passthrough()`, and rendered NOTHING: no error, no
   * warning, no element. `SchemaRenderer` strips both keys out of the props bag
   * it spreads, so neither reaches the component by another route either.
   *
   * @deprecated Not a channel `button-group` reads — nothing renders it.
   */
  children?: never;
}

/**
 * Union type of all navigation schemas
 */
export type NavigationSchema =
  | HeaderBarSchema
  | SidebarSchema
  | BreadcrumbSchema
  | PaginationSchema
  | NavigationMenuSchema
  | ButtonGroupSchema;
