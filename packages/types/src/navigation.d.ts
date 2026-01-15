/**
 * @object-ui/types - Navigation Component Schemas
 *
 * Type definitions for navigation and menu components.
 *
 * @module navigation
 * @packageDocumentation
 */
import type { BaseSchema, SchemaNode } from './base';
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
     * Collapsed state change handler
     */
    onCollapsedChange?: (collapsed: boolean) => void;
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
     * Click handler (if not using href)
     */
    onClick?: () => void;
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
}
/**
 * Pagination component
 */
export interface PaginationSchema extends BaseSchema {
    type: 'pagination';
    /**
     * Current page (1-indexed)
     */
    page: number;
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
     */
    onPageChange?: (page: number) => void;
}
/**
 * Union type of all navigation schemas
 */
export type NavigationSchema = HeaderBarSchema | SidebarSchema | BreadcrumbSchema | PaginationSchema;
