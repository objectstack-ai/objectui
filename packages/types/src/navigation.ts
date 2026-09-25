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
   * RETIRED (objectui#10387, ADR-0049) — `header-bar` reads no `title`.
   *
   * Not in `@objectstack/spec`, so the objectui#7759 ruling makes the read
   * site the truth, and there is none: the renderer's one function reads
   * `actions`, `crumbs`, `rightContent`, `search` and the inherited
   * `className` off `schema` and takes no spread props. Through the real `SchemaRenderer` an authored title drew the
   * header byte-identical to its absence. For the current page name, use the
   * last entry of `crumbs`.
   *
   * @deprecated Nothing renders it; the zod mirror refuses it by name.
   */
  title?: never;
  /**
   * RETIRED (objectui#10387, ADR-0049) — `header-bar` reads no `logo`.
   *
   * No read site and no spec declaration. The two faces had also drifted
   * apart: this declaration said an image URL `string`, the zod mirror a node
   * or node array, and neither ever rendered. For brand content use
   * `rightContent` or `actions`.
   *
   * @deprecated Nothing renders it; the zod mirror refuses it by name.
   */
  logo?: never;
  /**
   * RETIRED (objectui#10387, ADR-0049) — `header-bar` reads no `nav`.
   *
   * Not in `@objectstack/spec`, so the objectui#7759 ruling makes the read
   * site the truth, and there is none: the renderer's one function reads
   * `actions`, `crumbs`, `rightContent`, `search` and the inherited
   * `className` off `schema` and takes no spread props. Through the real `SchemaRenderer` an authored link list drew
   * the header byte-identical to its absence. No in-tree document authored it.
   * For links, use `crumbs` here, or a `navigation-menu` / `sidebar` node.
   *
   * @deprecated Nothing renders it; the zod mirror refuses it by name.
   */
  nav?: never;
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
   * RETIRED (objectui#10387, ADR-0049) — `header-bar` has no left slot.
   *
   * Not in `@objectstack/spec`; the renderer reads only `actions`, `crumbs`,
   * `rightContent`, `search` and the inherited `className`, and takes no spread
   * props, so an authored node rendered nothing. No in-tree document authored it. For custom content use
   * `rightContent` or `actions`.
   *
   * @deprecated Nothing renders it; the zod mirror refuses it by name.
   */
  left?: never;
  /**
   * RETIRED (objectui#10387, ADR-0049) — `header-bar` has no center slot.
   *
   * Same reading as `left`: no read site, no spec declaration, no in-tree
   * author. For custom content use `rightContent` or `actions`.
   *
   * @deprecated Nothing renders it; the zod mirror refuses it by name.
   */
  center?: never;
  /**
   * RETIRED (objectui#10387, ADR-0049) — `header-bar` has no `right` slot.
   *
   * No read site and no spec declaration; the right side of the header is
   * `actions` (a node list) and `rightContent` (one node), both read. An
   * authored `right` rendered nothing.
   *
   * @deprecated Nothing renders it; the zod mirror refuses it by name.
   */
  right?: never;
  /**
   * RETIRED (objectui#10387, ADR-0049) — `header-bar` reads no `sticky`.
   *
   * No read site and no spec declaration: `true` and `false` both drew the
   * same, non-sticky header. To pin it, give the parent layout the sticky
   * positioning.
   *
   * @deprecated Nothing renders it; the zod mirror refuses it by name.
   */
  sticky?: never;
  /**
   * RETIRED (objectui#10387, ADR-0049) — `header-bar` reads no `height`.
   *
   * No read of this key exists, and no in-tree document authored it. Not in
   * `@objectstack/spec`. The renderer's own classes set the height (`h-14`, and
   * `sm:h-16` from the `sm` breakpoint); to change it, author `className` (for
   * example `h-20 sm:h-20`), which is merged after them (objectui#10397).
   *
   * @deprecated Nothing renders it; the zod mirror refuses it by name.
   */
  height?: never;
  /**
   * RETIRED (objectui#10286, ADR-0049) — `header-bar` reads no `variant`.
   *
   * The key is not in `@objectstack/spec`, so the objectui#7759 ruling makes
   * the read site the truth, and the read site has none: the renderer's one
   * function reads `actions`, `crumbs`, `rightContent`, `search` and the
   * inherited `className` off `schema` and takes no spread props, so every
   * spelling rendered the same header. The two faces had also drifted apart on the way there — this
   * declaration offered `floating`, the zod mirror `transparent` — and
   * neither word had ever reached a class name.
   *
   * @deprecated Nothing renders it; the zod mirror refuses it by name.
   */
  variant?: never;
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
   * `actions`, `className` (since objectui#10397), `crumbs`, `rightContent`,
   * `search` (in `packages/components/src/renderers/navigation/header-bar.tsx`).
   *
   * Before objectui#9256 tombstoned them here, `body` and `children` were both
   * inherited-and-optional from {@link BaseSchema} — so authoring either here
   * type-checked, parsed green through `.passthrough()`, and rendered NOTHING:
   * no error, no warning, no element. objectui#6771 has since retired `body` on
   * `BaseSchema` itself; `BaseSchema` still declares `children`, so this node's
   * own tombstone is what refuses it here. `SchemaRenderer` strips both keys
   * out of the props bag it spreads, so neither reaches the component by
   * another route either.
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
   * `actions`, `className` (since objectui#10397), `crumbs`, `rightContent`,
   * `search` (in `packages/components/src/renderers/navigation/header-bar.tsx`).
   *
   * Before objectui#9256 tombstoned them here, `body` and `children` were both
   * inherited-and-optional from {@link BaseSchema} — so authoring either here
   * type-checked, parsed green through `.passthrough()`, and rendered NOTHING:
   * no error, no warning, no element. objectui#6771 has since retired `body` on
   * `BaseSchema` itself; `BaseSchema` still declares `children`, so this node's
   * own tombstone is what refuses it here. `SchemaRenderer` strips both keys
   * out of the props bag it spreads, so neither reaches the component by
   * another route either.
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
   * Before objectui#9256 tombstoned them here, `body` and `children` were both
   * inherited-and-optional from {@link BaseSchema} — so authoring either here
   * type-checked, parsed green through `.passthrough()`, and rendered NOTHING:
   * no error, no warning, no element. objectui#6771 has since retired `body` on
   * `BaseSchema` itself; `BaseSchema` still declares `children`, so this node's
   * own tombstone is what refuses it here. `SchemaRenderer` strips both keys
   * out of the props bag it spreads, so neither reaches the component by
   * another route either.
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
   * Before objectui#9256 tombstoned them here, `body` and `children` were both
   * inherited-and-optional from {@link BaseSchema} — so authoring either here
   * type-checked, parsed green through `.passthrough()`, and rendered NOTHING:
   * no error, no warning, no element. objectui#6771 has since retired `body` on
   * `BaseSchema` itself; `BaseSchema` still declares `children`, so this node's
   * own tombstone is what refuses it here. `SchemaRenderer` strips both keys
   * out of the props bag it spreads, so neither reaches the component by
   * another route either.
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
   * Before objectui#9256 tombstoned them here, `body` and `children` were both
   * inherited-and-optional from {@link BaseSchema} — so authoring either here
   * type-checked, parsed green through `.passthrough()`, and rendered NOTHING:
   * no error, no warning, no element. objectui#6771 has since retired `body` on
   * `BaseSchema` itself; `BaseSchema` still declares `children`, so this node's
   * own tombstone is what refuses it here. `SchemaRenderer` strips both keys
   * out of the props bag it spreads, so neither reaches the component by
   * another route either.
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
   * Before objectui#9256 tombstoned them here, `body` and `children` were both
   * inherited-and-optional from {@link BaseSchema} — so authoring either here
   * type-checked, parsed green through `.passthrough()`, and rendered NOTHING:
   * no error, no warning, no element. objectui#6771 has since retired `body` on
   * `BaseSchema` itself; `BaseSchema` still declares `children`, so this node's
   * own tombstone is what refuses it here. `SchemaRenderer` strips both keys
   * out of the props bag it spreads, so neither reaches the component by
   * another route either.
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
   * Before objectui#9256 tombstoned them here, `body` and `children` were both
   * inherited-and-optional from {@link BaseSchema} — so authoring either here
   * type-checked, parsed green through `.passthrough()`, and rendered NOTHING:
   * no error, no warning, no element. objectui#6771 has since retired `body` on
   * `BaseSchema` itself; `BaseSchema` still declares `children`, so this node's
   * own tombstone is what refuses it here. `SchemaRenderer` strips both keys
   * out of the props bag it spreads, so neither reaches the component by
   * another route either.
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
   * Before objectui#9256 tombstoned them here, `body` and `children` were both
   * inherited-and-optional from {@link BaseSchema} — so authoring either here
   * type-checked, parsed green through `.passthrough()`, and rendered NOTHING:
   * no error, no warning, no element. objectui#6771 has since retired `body` on
   * `BaseSchema` itself; `BaseSchema` still declares `children`, so this node's
   * own tombstone is what refuses it here. `SchemaRenderer` strips both keys
   * out of the props bag it spreads, so neither reaches the component by
   * another route either.
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
   * Before objectui#9256 tombstoned them here, `body` and `children` were both
   * inherited-and-optional from {@link BaseSchema} — so authoring either here
   * type-checked, parsed green through `.passthrough()`, and rendered NOTHING:
   * no error, no warning, no element. objectui#6771 has since retired `body` on
   * `BaseSchema` itself; `BaseSchema` still declares `children`, so this node's
   * own tombstone is what refuses it here. `SchemaRenderer` strips both keys
   * out of the props bag it spreads, so neither reaches the component by
   * another route either.
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
   * Before objectui#9256 tombstoned them here, `body` and `children` were both
   * inherited-and-optional from {@link BaseSchema} — so authoring either here
   * type-checked, parsed green through `.passthrough()`, and rendered NOTHING:
   * no error, no warning, no element. objectui#6771 has since retired `body` on
   * `BaseSchema` itself; `BaseSchema` still declares `children`, so this node's
   * own tombstone is what refuses it here. `SchemaRenderer` strips both keys
   * out of the props bag it spreads, so neither reaches the component by
   * another route either.
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
