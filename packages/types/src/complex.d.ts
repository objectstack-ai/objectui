/**
 * @object-ui/types - Complex Component Schemas
 *
 * Type definitions for advanced/composite components.
 *
 * @module complex
 * @packageDocumentation
 */
import type { BaseSchema, SchemaNode } from './base';
/**
 * Kanban column
 */
export interface KanbanColumn {
    /**
     * Unique column identifier
     */
    id: string;
    /**
     * Column title
     */
    title: string;
    /**
     * Column cards/items
     */
    items: KanbanCard[];
    /**
     * Column color/variant
     */
    color?: string;
    /**
     * Maximum number of cards allowed
     */
    limit?: number;
    /**
     * Whether column is collapsed
     */
    collapsed?: boolean;
}
/**
 * Kanban card
 */
export interface KanbanCard {
    /**
     * Unique card identifier
     */
    id: string;
    /**
     * Card title
     */
    title: string;
    /**
     * Card description
     */
    description?: string;
    /**
     * Card labels/tags
     */
    labels?: string[];
    /**
     * Card assignees
     */
    assignees?: string[];
    /**
     * Card due date
     */
    dueDate?: string | Date;
    /**
     * Card priority
     */
    priority?: 'low' | 'medium' | 'high' | 'critical';
    /**
     * Custom card content
     */
    content?: SchemaNode | SchemaNode[];
    /**
     * Additional card data
     */
    data?: any;
}
/**
 * Kanban board component
 */
export interface KanbanSchema extends BaseSchema {
    type: 'kanban';
    /**
     * Kanban columns
     */
    columns: KanbanColumn[];
    /**
     * Enable drag and drop
     * @default true
     */
    draggable?: boolean;
    /**
     * Card move handler
     */
    onCardMove?: (cardId: string, fromColumn: string, toColumn: string, position: number) => void;
    /**
     * Card click handler
     */
    onCardClick?: (card: KanbanCard) => void;
    /**
     * Column add handler
     */
    onColumnAdd?: (column: KanbanColumn) => void;
    /**
     * Card add handler
     */
    onCardAdd?: (columnId: string, card: KanbanCard) => void;
}
/**
 * Calendar view mode
 */
export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';
/**
 * Calendar event
 */
export interface CalendarEvent {
    /**
     * Unique event identifier
     */
    id: string;
    /**
     * Event title
     */
    title: string;
    /**
     * Event description
     */
    description?: string;
    /**
     * Event start date/time
     */
    start: string | Date;
    /**
     * Event end date/time
     */
    end: string | Date;
    /**
     * Whether event is all day
     */
    allDay?: boolean;
    /**
     * Event color
     */
    color?: string;
    /**
     * Additional event data
     */
    data?: any;
}
/**
 * Calendar view component
 */
export interface CalendarViewSchema extends BaseSchema {
    type: 'calendar-view';
    /**
     * Calendar events
     */
    events: CalendarEvent[];
    /**
     * Default view mode
     * @default 'month'
     */
    defaultView?: CalendarViewMode;
    /**
     * Controlled view mode
     */
    view?: CalendarViewMode;
    /**
     * Default date
     */
    defaultDate?: string | Date;
    /**
     * Controlled date
     */
    date?: string | Date;
    /**
     * Available views
     * @default ['month', 'week', 'day']
     */
    views?: CalendarViewMode[];
    /**
     * Enable event creation
     * @default false
     */
    editable?: boolean;
    /**
     * Event click handler
     */
    onEventClick?: (event: CalendarEvent) => void;
    /**
     * Event create handler
     */
    onEventCreate?: (start: Date, end: Date) => void;
    /**
     * Event update handler
     */
    onEventUpdate?: (event: CalendarEvent) => void;
    /**
     * Date change handler
     */
    onDateChange?: (date: Date) => void;
    /**
     * View change handler
     */
    onViewChange?: (view: CalendarViewMode) => void;
}
/**
 * Filter operator
 */
export type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'is_empty' | 'is_not_empty' | 'in' | 'not_in';
/**
 * Filter condition
 */
export interface FilterCondition {
    /**
     * Field to filter
     */
    field: string;
    /**
     * Filter operator
     */
    operator: FilterOperator;
    /**
     * Filter value
     */
    value?: any;
}
/**
 * Filter group
 */
export interface FilterGroup {
    /**
     * Logical operator (AND/OR)
     * @default 'and'
     */
    operator: 'and' | 'or';
    /**
     * Filter conditions or nested groups
     */
    conditions: (FilterCondition | FilterGroup)[];
}
/**
 * Filter builder component
 */
export interface FilterBuilderSchema extends BaseSchema {
    type: 'filter-builder';
    /**
     * Available fields for filtering
     */
    fields: FilterField[];
    /**
     * Default filter configuration
     */
    defaultValue?: FilterGroup;
    /**
     * Controlled filter value
     */
    value?: FilterGroup;
    /**
     * Change handler
     */
    onChange?: (filter: FilterGroup) => void;
    /**
     * Allow nested groups
     * @default true
     */
    allowGroups?: boolean;
    /**
     * Maximum nesting depth
     * @default 3
     */
    maxDepth?: number;
}
/**
 * Filter field definition
 */
export interface FilterField {
    /**
     * Field name/key
     */
    name: string;
    /**
     * Field label
     */
    label: string;
    /**
     * Field type
     */
    type: 'string' | 'number' | 'date' | 'boolean' | 'select';
    /**
     * Available operators for this field
     */
    operators?: FilterOperator[];
    /**
     * Options (for select type)
     */
    options?: {
        label: string;
        value: any;
    }[];
}
/**
 * Carousel item
 */
export interface CarouselItem {
    /**
     * Unique item identifier
     */
    id?: string;
    /**
     * Item content
     */
    content: SchemaNode | SchemaNode[];
}
/**
 * Carousel component
 */
export interface CarouselSchema extends BaseSchema {
    type: 'carousel';
    /**
     * Carousel items
     */
    items: CarouselItem[];
    /**
     * Auto-play interval (ms)
     */
    autoPlay?: number;
    /**
     * Show navigation arrows
     * @default true
     */
    showArrows?: boolean;
    /**
     * Show pagination dots
     * @default true
     */
    showDots?: boolean;
    /**
     * Enable infinite loop
     * @default true
     */
    loop?: boolean;
    /**
     * Items visible at once
     * @default 1
     */
    itemsPerView?: number;
    /**
     * Gap between items
     */
    gap?: number;
    /**
     * Slide change handler
     */
    onSlideChange?: (index: number) => void;
}
/**
 * Chatbot message
 */
export interface ChatMessage {
    /**
     * Unique message identifier
     */
    id: string;
    /**
     * Message role
     */
    role: 'user' | 'assistant' | 'system';
    /**
     * Message content
     */
    content: string;
    /**
     * Message timestamp
     */
    timestamp?: string | Date;
    /**
     * Message metadata
     */
    metadata?: any;
}
/**
 * Chatbot component
 */
export interface ChatbotSchema extends BaseSchema {
    type: 'chatbot';
    /**
     * Chat messages
     */
    messages: ChatMessage[];
    /**
     * Input placeholder
     * @default 'Type a message...'
     */
    placeholder?: string;
    /**
     * Whether chat is loading (thinking)
     */
    loading?: boolean;
    /**
     * Message send handler
     */
    onSendMessage?: (message: string) => void | Promise<void>;
    /**
     * Show avatars
     * @default true
     */
    showAvatars?: boolean;
    /**
     * User avatar
     */
    userAvatar?: string;
    /**
     * Assistant avatar
     */
    assistantAvatar?: string;
    /**
     * Enable markdown rendering
     * @default true
     */
    markdown?: boolean;
    /**
     * Chat height
     */
    height?: string | number;
}
/**
 * Union type of all complex schemas
 */
export type ComplexSchema = KanbanSchema | CalendarViewSchema | FilterBuilderSchema | CarouselSchema | ChatbotSchema;
