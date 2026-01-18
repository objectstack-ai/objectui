/**
 * @objectstack/spec
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @objectstack/spec - Universal UI Component Specification
 * 
 * This is the foundational protocol for all UI components in the ObjectStack ecosystem.
 * All component schemas must extend from UIComponent directly or indirectly.
 * 
 * @module @objectstack/spec
 * @packageDocumentation
 */

/**
 * Component type identifier
 * This is the discriminator field that determines which renderer to use
 */
export type ComponentType = string;

/**
 * UIComponent - The Universal Component Interface
 * 
 * This is the "highest law" - the foundational interface that all UI components
 * in the ObjectStack ecosystem must implement. It defines the core protocol
 * for schema-driven UI rendering.
 * 
 * Design Principles:
 * - **Type-Driven**: The `type` field is the discriminator for component resolution
 * - **Props-Based**: All component-specific properties go in the `props` object
 * - **Composable**: Components can have children for nested structures
 * - **Extensible**: Additional properties can be added via index signature
 * 
 * @example
 * ```typescript
 * const component: UIComponent = {
 *   type: 'button',
 *   id: 'submit-btn',
 *   props: {
 *     label: 'Submit',
 *     variant: 'primary'
 *   }
 * }
 * ```
 */
export interface UIComponent {
  /**
   * Component type identifier (discriminator)
   * 
   * This field determines which renderer/component implementation to use.
   * Must be a registered component type in the component registry.
   * 
   * @example 'button', 'input', 'card', 'grid', 'chart', 'table'
   */
  type: ComponentType;

  /**
   * Unique identifier for this component instance
   * 
   * Used for:
   * - DOM element IDs
   * - React keys
   * - Event targeting
   * - State management
   * - Accessibility (ARIA)
   * 
   * @example 'user-form', 'submit-button', 'email-input'
   */
  id?: string;

  /**
   * Component-specific properties
   * 
   * This object contains all the configuration and behavior settings
   * specific to the component type. The shape of this object is determined
   * by the component's implementation.
   * 
   * Standard HTML attributes (role, aria-*, data-*) should also be placed here.
   * 
   * @example
   * ```typescript
   * props: {
   *   label: 'Click Me',
   *   variant: 'primary',
   *   size: 'lg',
   *   disabled: false,
   *   role: 'button',
   *   'aria-label': 'Submit form'
   * }
   * ```
   */
  props?: Record<string, any>;

  /**
   * Child components or content
   * 
   * Allows components to be composed hierarchically. Can be:
   * - A single UIComponent
   * - An array of UIComponents
   * - Primitive values (string, number, boolean)
   * - null or undefined (no children)
   * 
   * @example
   * ```typescript
   * children: [
   *   { type: 'text', props: { value: 'Hello' } },
   *   { type: 'button', props: { label: 'Click' } }
   * ]
   * ```
   */
  children?: SchemaNode | SchemaNode[];

  /**
   * Index signature for extensibility
   * 
   * Allows component schemas to add additional properties beyond the base interface.
   * This is important for framework-specific extensions and custom implementations.
   */
  [key: string]: any;
}

/**
 * SchemaNode - Union type for schema tree nodes
 * 
 * A schema node can be:
 * - A UIComponent object (structured component)
 * - A primitive value (string, number, boolean) for simple content
 * - null or undefined (empty/conditional content)
 * 
 * This union type enables flexible composition patterns where simple
 * values can be mixed with complex components.
 * 
 * @example
 * ```typescript
 * const nodes: SchemaNode[] = [
 *   'Plain text',
 *   { type: 'button', props: { label: 'Click' } },
 *   42,
 *   null
 * ]
 * ```
 */
export type SchemaNode = UIComponent | string | number | boolean | null | undefined;

/**
 * Action definition for event handling
 * 
 * Actions represent behaviors that can be triggered by user interactions
 * or system events. They are defined as data (not functions) to enable
 * serialization and persistence.
 */
export interface ActionSchema {
  /**
   * Action type identifier
   * @example 'navigate', 'submit', 'validate', 'api-call', 'dialog-open'
   */
  action: string;

  /**
   * Target component or resource
   * @example 'form-1', 'modal-confirm', '/api/users'
   */
  target?: string;

  /**
   * Action parameters
   */
  params?: Record<string, any>;

  /**
   * Condition for action execution (expression)
   * @example "${data.isValid === true}"
   */
  condition?: string;
}

/**
 * Component metadata for designer/editor integration
 * 
 * Provides additional information about a component for tooling,
 * documentation, and visual editors.
 */
export interface ComponentMetadata {
  /**
   * Display name in component palette
   */
  label?: string;

  /**
   * Icon identifier (name or SVG)
   */
  icon?: string;

  /**
   * Category for grouping
   * @example 'Layout', 'Form', 'Data Display', 'Navigation'
   */
  category?: string;

  /**
   * Description for documentation
   */
  description?: string;

  /**
   * Tags for search/filtering
   */
  tags?: string[];

  /**
   * Whether component can contain children
   */
  isContainer?: boolean;

  /**
   * Example configurations
   */
  examples?: Record<string, UIComponent>;
}
