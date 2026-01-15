/**
 * @object-ui/types - Disclosure Component Schemas
 *
 * Type definitions for collapsible and expandable components.
 *
 * @module disclosure
 * @packageDocumentation
 */
import type { BaseSchema, SchemaNode } from './base';
/**
 * Accordion item
 */
export interface AccordionItem {
    /**
     * Unique item identifier
     */
    value: string;
    /**
     * Item title/trigger
     */
    title: string;
    /**
     * Item content
     */
    content: SchemaNode | SchemaNode[];
    /**
     * Whether item is disabled
     */
    disabled?: boolean;
    /**
     * Item icon
     */
    icon?: string;
}
/**
 * Accordion component
 */
export interface AccordionSchema extends BaseSchema {
    type: 'accordion';
    /**
     * Accordion items
     */
    items: AccordionItem[];
    /**
     * Accordion type
     * @default 'single'
     */
    accordionType?: 'single' | 'multiple';
    /**
     * Whether items are collapsible
     * @default true
     */
    collapsible?: boolean;
    /**
     * Default expanded item values
     */
    defaultValue?: string | string[];
    /**
     * Controlled expanded item values
     */
    value?: string | string[];
    /**
     * Change handler
     */
    onValueChange?: (value: string | string[]) => void;
    /**
     * Accordion variant
     * @default 'default'
     */
    variant?: 'default' | 'bordered' | 'separated';
}
/**
 * Collapsible component
 */
export interface CollapsibleSchema extends BaseSchema {
    type: 'collapsible';
    /**
     * Trigger content/label
     */
    trigger: string | SchemaNode;
    /**
     * Collapsible content
     */
    content: SchemaNode | SchemaNode[];
    /**
     * Default open state
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Controlled open state
     */
    open?: boolean;
    /**
     * Whether collapsible is disabled
     */
    disabled?: boolean;
    /**
     * Open state change handler
     */
    onOpenChange?: (open: boolean) => void;
}
/**
 * Union type of all disclosure schemas
 */
export type DisclosureSchema = AccordionSchema | CollapsibleSchema;
