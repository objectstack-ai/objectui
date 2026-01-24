# FormRenderer Component

The `FormRenderer` component is a React component that renders forms based on the `FormView` schema from `@objectstack/spec`. It provides a flexible and powerful way to create forms with minimal code.

## Features

- ✅ **Schema-driven**: Define forms using JSON schema from `@objectstack/spec`
- ✅ **Multi-column layouts**: Support for 1-4 column grid layouts
- ✅ **Collapsible sections**: Organize forms with collapsible sections
- ✅ **Field validation**: Built-in validation using `react-hook-form` and `zod`
- ✅ **Multiple field types**: Text, Number, Checkbox, Textarea, Select, Date, DateTime, Time
- ✅ **Conditional fields**: Show/hide fields based on conditions
- ✅ **Column spanning**: Fields can span multiple columns
- ✅ **Help text**: Display helpful descriptions for fields
- ✅ **Required fields**: Mark fields as required with validation

## Installation

The FormRenderer component is part of the `@object-ui/react` package:

```bash
npm install @object-ui/react @objectstack/spec react-hook-form zod
```

Or with pnpm:

```bash
pnpm add @object-ui/react @objectstack/spec react-hook-form zod
```

## Basic Usage

```tsx
import { FormRenderer } from '@object-ui/react';
import type { FormView } from '@objectstack/spec/ui';

const schema: FormView = {
  type: 'simple',
  sections: [
    {
      label: 'Contact Information',
      collapsible: false,
      collapsed: false,
      columns: 2,
      fields: [
        {
          field: 'firstName',
          label: 'First Name',
          required: true,
          widget: 'text',
        },
        {
          field: 'lastName',
          label: 'Last Name',
          required: true,
          widget: 'text',
        },
        {
          field: 'email',
          label: 'Email',
          required: true,
          widget: 'email',
          helpText: 'We will never share your email',
        },
      ],
    },
  ],
};

function MyForm() {
  const handleSubmit = (data: Record<string, any>) => {
    console.log('Form submitted:', data);
  };

  return (
    <FormRenderer
      schema={schema}
      onSubmit={handleSubmit}
    />
  );
}
```

## Props

### FormRendererProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `schema` | `FormView` | Yes | The FormView schema from @objectstack/spec |
| `data` | `Record<string, any>` | No | Initial form data |
| `onSubmit` | `(data: Record<string, any>) => void \| Promise<void>` | No | Form submission handler |
| `onChange` | `(data: Record<string, any>) => void` | No | Form change handler |
| `className` | `string` | No | Custom CSS class for the form |
| `disabled` | `boolean` | No | Whether the form is disabled |

## Schema Structure

### FormView

The main schema that defines the entire form.

```typescript
interface FormView {
  type: 'simple' | 'tabbed' | 'wizard';
  sections?: FormSection[];
  data?: DataSource; // Optional data source configuration
}
```

### FormSection

Defines a section of the form with its own layout.

```typescript
interface FormSection {
  label?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  columns: 1 | 2 | 3 | 4;
  fields: (string | FormField)[];
}
```

### FormField

Defines individual form fields.

```typescript
interface FormField {
  field: string; // Field name
  label?: string;
  placeholder?: string;
  helpText?: string;
  readonly?: boolean;
  required?: boolean;
  hidden?: boolean;
  colSpan?: number; // Number of columns to span (1-4)
  widget?: string; // Widget type (text, number, checkbox, etc.)
  dependsOn?: string; // Field dependency
  visibleOn?: string; // Visibility condition
}
```

## Supported Widget Types

The `FieldFactory` component supports the following widget types:

- `text`, `string` - Text input
- `email` - Email input
- `password` - Password input
- `url` - URL input
- `tel` - Telephone input
- `number`, `integer`, `float` - Number input
- `checkbox`, `boolean` - Checkbox
- `textarea` - Textarea
- `select`, `dropdown` - Select dropdown
- `date` - Date picker
- `datetime`, `datetime-local` - DateTime picker
- `time` - Time picker

## Examples

### Multi-Section Form

```tsx
const schema: FormView = {
  type: 'simple',
  sections: [
    {
      label: 'Personal Information',
      collapsible: true,
      collapsed: false,
      columns: 2,
      fields: [
        { field: 'firstName', label: 'First Name', required: true, widget: 'text' },
        { field: 'lastName', label: 'Last Name', required: true, widget: 'text' },
        { field: 'email', label: 'Email', required: true, widget: 'email' },
        { field: 'phone', label: 'Phone', widget: 'tel' },
      ],
    },
    {
      label: 'Preferences',
      collapsible: true,
      collapsed: true,
      columns: 1,
      fields: [
        {
          field: 'newsletter',
          label: 'Subscribe to newsletter',
          widget: 'checkbox',
          helpText: 'Receive updates about our products',
        },
      ],
    },
  ],
};
```

### Form with Initial Data

```tsx
const initialData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  newsletter: true,
};

<FormRenderer
  schema={schema}
  data={initialData}
  onSubmit={handleSubmit}
/>
```

### Form with Column Spanning

```tsx
const schema: FormView = {
  type: 'simple',
  sections: [
    {
      label: 'Contact',
      columns: 2,
      fields: [
        { field: 'name', label: 'Name', widget: 'text' },
        { field: 'email', label: 'Email', widget: 'email' },
        {
          field: 'message',
          label: 'Message',
          widget: 'textarea',
          colSpan: 2, // Spans both columns
        },
      ],
    },
  ],
};
```

## Architecture

The FormRenderer is built on top of:

- **react-hook-form**: For form state management and validation
- **zod**: For schema validation
- **@objectstack/spec**: For schema definitions

## Customization

You can customize the appearance of the form by:

1. Using the `className` prop on the FormRenderer
2. Using Tailwind CSS classes in your application
3. Extending the FieldFactory component for custom widgets

## Related Components

- `FieldFactory`: Renders individual form fields based on widget type
- `SchemaRenderer`: General-purpose schema renderer for ObjectUI

## License

MIT

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.
