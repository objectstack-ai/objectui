# Filter Builder Component

An Airtable-like filter builder component for building complex query conditions in Object UI.

## Overview

The Filter Builder component provides a user-friendly interface for creating and managing filter conditions. It supports:

- ✅ Dynamic add/remove filter conditions
- ✅ Field selection from configurable list
- ✅ Type-aware operators (text, number, boolean)
- ✅ AND/OR logic toggling
- ✅ Schema-driven configuration
- ✅ Tailwind CSS styled with Shadcn UI components

## Usage

### Basic Example

```typescript
{
  type: 'filter-builder',
  name: 'userFilters',
  label: 'User Filters',
  fields: [
    { value: 'name', label: 'Name', type: 'text' },
    { value: 'email', label: 'Email', type: 'text' },
    { value: 'age', label: 'Age', type: 'number' },
    { value: 'status', label: 'Status', type: 'text' }
  ],
  value: {
    id: 'root',
    logic: 'and',
    conditions: [
      {
        id: 'cond-1',
        field: 'status',
        operator: 'equals',
        value: 'active'
      }
    ]
  }
}
```

### With Initial Empty State

```typescript
{
  type: 'filter-builder',
  name: 'productFilters',
  label: 'Product Filters',
  fields: [
    { value: 'name', label: 'Product Name', type: 'text' },
    { value: 'price', label: 'Price', type: 'number' },
    { value: 'inStock', label: 'In Stock', type: 'boolean' }
  ],
  value: {
    id: 'root',
    logic: 'and',
    conditions: []
  }
}
```

## Props

### Schema Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `string` | ✅ | Must be `'filter-builder'` |
| `name` | `string` | ✅ | Form field name for the filter value |
| `label` | `string` | ❌ | Label displayed above the filter builder |
| `fields` | `Field[]` | ✅ | Array of available fields for filtering |
| `value` | `FilterGroup` | ❌ | Initial filter configuration |

### Field Type

```typescript
interface Field {
  value: string;    // Field identifier
  label: string;    // Display label
  type?: string;    // Field type: 'text' | 'number' | 'boolean'
}
```

### FilterGroup Type

```typescript
interface FilterGroup {
  id: string;                    // Group identifier
  logic: 'and' | 'or';          // Logic operator
  conditions: FilterCondition[]; // Array of conditions
}

interface FilterCondition {
  id: string;                    // Condition identifier
  field: string;                 // Field value
  operator: string;              // Operator (see below)
  value: string | number | boolean; // Filter value
}
```

## Operators

The available operators change based on the field type:

### Text Fields
- `equals` - Equals
- `notEquals` - Does not equal
- `contains` - Contains
- `notContains` - Does not contain
- `isEmpty` - Is empty
- `isNotEmpty` - Is not empty

### Number Fields
- `equals` - Equals
- `notEquals` - Does not equal
- `greaterThan` - Greater than
- `lessThan` - Less than
- `greaterOrEqual` - Greater than or equal
- `lessOrEqual` - Less than or equal
- `isEmpty` - Is empty
- `isNotEmpty` - Is not empty

### Boolean Fields
- `equals` - Equals
- `notEquals` - Does not equal

## Events

The component emits change events when the filter configuration is modified:

```typescript
{
  target: {
    name: 'filters',
    value: {
      id: 'root',
      logic: 'and',
      conditions: [...]
    }
  }
}
```

## Demo

To see the filter builder in action:

```bash
pnpm --filter prototype dev
# Visit http://localhost:5173/?demo=filter-builder
```

## Styling

The component is fully styled with Tailwind CSS and follows the Object UI design system. All Shadcn UI components are used for consistent look and feel.

You can customize the appearance using the `className` prop or by overriding Tailwind classes.

## Integration

The Filter Builder integrates seamlessly with Object UI's schema system and can be used in:

- Forms
- Data tables
- Search interfaces
- Admin panels
- Dashboard filters

## Example in Context

```typescript
const pageSchema = {
  type: 'page',
  title: 'User Management',
  body: [
    {
      type: 'card',
      body: [
        {
          type: 'filter-builder',
          name: 'userFilters',
          label: 'Filter Users',
          fields: [
            { value: 'name', label: 'Name', type: 'text' },
            { value: 'email', label: 'Email', type: 'text' },
            { value: 'age', label: 'Age', type: 'number' },
            { value: 'department', label: 'Department', type: 'text' },
            { value: 'active', label: 'Active', type: 'boolean' }
          ]
        }
      ]
    },
    {
      type: 'table',
      // table configuration...
    }
  ]
};
```

## Technical Details

- Built with React 18+ hooks
- Uses Radix UI primitives (Select, Popover)
- Type-safe with TypeScript
- Accessible keyboard navigation
- Responsive design

## Browser Support

Works in all modern browsers that support:
- ES6+
- CSS Grid
- Flexbox
- crypto.randomUUID()
