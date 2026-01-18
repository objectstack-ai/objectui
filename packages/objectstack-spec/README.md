# @objectstack/spec

**The Universal UI Component Specification**

*The foundational protocol for the ObjectStack ecosystem*

---

## Overview

`@objectstack/spec` (v0.1.1) defines the **highest law** - the core interfaces and types that all UI components in the ObjectStack ecosystem must follow. This package provides the universal protocol that enables schema-driven UI rendering across different frameworks and implementations.

## Key Concepts

### UIComponent - The Foundation

Every UI component in the ObjectStack ecosystem extends from `UIComponent`:

```typescript
interface UIComponent {
  type: string;           // Component type discriminator
  id?: string;            // Unique identifier
  props?: Record<string, any>;  // Component-specific properties
  children?: SchemaNode | SchemaNode[];  // Child content
  [key: string]: any;     // Extensibility
}
```

### The Inheritance Chain

```
UIComponent (@objectstack/spec)          ← The highest law
    ↓
BaseSchema (@object-ui/types)            ← ObjectUI extensions
    ↓
Specific Schemas (ChartSchema, etc.)     ← Component implementations
```

## Installation

```bash
npm install @objectstack/spec
# or
yarn add @objectstack/spec
# or
pnpm add @objectstack/spec
```

## Usage

### Type Definitions

```typescript
import type { UIComponent, SchemaNode, ComponentType } from '@objectstack/spec';

// Define a component
const button: UIComponent = {
  type: 'button',
  id: 'submit-btn',
  props: {
    label: 'Submit',
    variant: 'primary',
    onClick: () => console.log('clicked')
  }
};

// Compose components
const form: UIComponent = {
  type: 'form',
  id: 'user-form',
  children: [
    { type: 'input', props: { name: 'email', label: 'Email' } },
    { type: 'input', props: { name: 'password', label: 'Password' } },
    button
  ]
};
```

### Extending UIComponent

```typescript
import type { UIComponent } from '@objectstack/spec';

// Create your own schema
interface CustomButtonSchema extends UIComponent {
  type: 'custom-button';
  props?: {
    label?: string;
    variant?: 'primary' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
  };
}

const myButton: CustomButtonSchema = {
  type: 'custom-button',
  props: {
    label: 'Click Me',
    variant: 'primary',
    size: 'lg'
  }
};
```

## Design Principles

### 1. Type as Discriminator

The `type` field is the **discriminator** that determines which component to render:

```typescript
function resolveComponent(schema: UIComponent) {
  switch (schema.type) {
    case 'button': return ButtonComponent;
    case 'input': return InputComponent;
    case 'chart': return ChartComponent;
    default: return FallbackComponent;
  }
}
```

### 2. Props-Based Configuration

All component-specific properties go in the `props` object:

```typescript
{
  type: 'chart',
  props: {
    chartType: 'bar',
    series: [...],
    showLegend: true
  }
}
```

### 3. Composability via Children

Components can nest indefinitely:

```typescript
{
  type: 'card',
  children: [
    { type: 'heading', props: { text: 'Title' } },
    { type: 'text', props: { value: 'Content' } },
    { type: 'button', props: { label: 'Action' } }
  ]
}
```

### 4. Framework Agnostic

The spec is pure TypeScript with **zero dependencies**:
- ✅ Works with React, Vue, Angular, Svelte
- ✅ No runtime overhead
- ✅ Complete type safety
- ✅ Serializable to JSON

## Core Types

### UIComponent

The base interface for all UI components.

### SchemaNode

Union type for component tree nodes:
```typescript
type SchemaNode = UIComponent | string | number | boolean | null | undefined;
```

### ComponentType

Type alias for component type identifiers:
```typescript
type ComponentType = string;
```

### ActionSchema

Interface for event actions:
```typescript
interface ActionSchema {
  action: string;
  target?: string;
  params?: Record<string, any>;
  condition?: string;
}
```

### ComponentMetadata

Metadata for designer/editor integration:
```typescript
interface ComponentMetadata {
  label?: string;
  icon?: string;
  category?: string;
  description?: string;
  tags?: string[];
  isContainer?: boolean;
  examples?: Record<string, UIComponent>;
}
```

## Compliance Rules

When implementing components for the ObjectStack ecosystem:

1. ✅ **MUST** extend from `UIComponent` (directly or indirectly)
2. ✅ **MUST** include a `type` field (the discriminator)
3. ✅ **MUST** place component-specific props in the `props` object
4. ✅ **SHOULD** support `children` for composable components
5. ✅ **SHOULD** support `id` for unique identification

## Examples

### Simple Component

```typescript
const text: UIComponent = {
  type: 'text',
  props: {
    value: 'Hello World',
    className: 'text-lg font-bold'
  }
};
```

### Container Component

```typescript
const grid: UIComponent = {
  type: 'grid',
  props: {
    columns: 3,
    gap: 4
  },
  children: [
    { type: 'card', props: { title: 'Card 1' } },
    { type: 'card', props: { title: 'Card 2' } },
    { type: 'card', props: { title: 'Card 3' } }
  ]
};
```

### With Actions

```typescript
const button: UIComponent = {
  type: 'button',
  props: {
    label: 'Submit',
    events: {
      onClick: [
        { action: 'validate', target: 'form-1' },
        { action: 'submit', target: 'form-1' }
      ]
    }
  }
};
```

## Version History

### v0.1.1 (Current)

Initial release with core interfaces:
- `UIComponent` - Base component interface
- `SchemaNode` - Union type for tree nodes
- `ActionSchema` - Event action definition
- `ComponentMetadata` - Designer metadata

## Related Packages

- **[@object-ui/types](https://www.npmjs.com/package/@object-ui/types)** - ObjectUI protocol extensions
- **[@object-ui/core](https://www.npmjs.com/package/@object-ui/core)** - Schema validation and expression engine
- **[@object-ui/react](https://www.npmjs.com/package/@object-ui/react)** - React renderer implementation
- **[@object-ui/components](https://www.npmjs.com/package/@object-ui/components)** - Standard UI components

## Philosophy

> **"Protocol First, Implementation Later"**

By defining a universal specification first, we enable:
- 🔄 Multiple UI implementations (Shadcn, Material, Ant Design)
- 🔄 Multiple frameworks (React, Vue, Svelte, Angular)
- 🔄 Multiple backends (REST, GraphQL, ObjectQL)
- 🔄 Static analysis without runtime dependencies

## License

MIT

## Links

- [GitHub](https://github.com/objectstack-ai/objectui)
- [Documentation](https://objectui.org)
- [ObjectStack](https://objectstack.ai)
