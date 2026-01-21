# AI Prompt: Form Components

## Overview

Form components handle **user input** and **data collection**. They are the most interactive components in ObjectUI, managing state, validation, and user interactions while remaining controlled by schemas.

**Category**: `form`  
**Examples**: input, select, checkbox, radio, switch, textarea, button, slider  
**Complexity**: ⭐⭐⭐ Complex  
**Package**: `@object-ui/components/src/renderers/form/`

## Purpose

Form components:
1. **Collect user input** (text, selections, toggles)
2. **Validate data** (required, patterns, ranges)
3. **Provide feedback** (errors, hints, loading states)
4. **Submit data** (actions, API calls)

## Core Form Components

### Input Component
Text input field with validation.

**Schema**:
```json
{
  "type": "input",
  "name": "email",
  "label": "Email Address",
  "placeholder": "you@example.com",
  "inputType": "email",
  "required": true,
  "validation": {
    "type": "email",
    "message": "Invalid email address"
  }
}
```

**Implementation**:
```tsx
import { Input as ShadcnInput } from '@/ui/input';
import { Label } from '@/ui/label';
import { useDataContext } from '@object-ui/react';

export function InputRenderer({ schema }: RendererProps<InputSchema>) {
  const { data, setData } = useDataContext();
  const value = data[schema.name] || schema.defaultValue || '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData(schema.name, e.target.value);
  };

  return (
    <div className={cn('space-y-2', schema.className)}>
      {schema.label && (
        <Label htmlFor={schema.name}>
          {schema.label}
          {schema.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <ShadcnInput
        id={schema.name}
        name={schema.name}
        type={schema.inputType || 'text'}
        placeholder={schema.placeholder}
        value={value}
        onChange={handleChange}
        disabled={schema.disabled}
        readOnly={schema.readOnly}
        required={schema.required}
        aria-required={schema.required}
        aria-invalid={!!schema.error}
        aria-describedby={schema.description ? `${schema.name}-description` : undefined}
      />
      
      {schema.description && (
        <p id={`${schema.name}-description`} className="text-sm text-muted-foreground">
          {schema.description}
        </p>
      )}
      
      {schema.error && (
        <p className="text-sm text-destructive" role="alert">
          {schema.error}
        </p>
      )}
    </div>
  );
}
```

### Select Component
Dropdown selection field.

**Schema**:
```json
{
  "type": "select",
  "name": "country",
  "label": "Country",
  "placeholder": "Select a country",
  "options": [
    { "value": "us", "label": "United States" },
    { "value": "uk", "label": "United Kingdom" },
    { "value": "ca", "label": "Canada" }
  ],
  "required": true
}
```

**Implementation**:
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Label } from '@/ui/label';
import { useDataContext } from '@object-ui/react';

export function SelectRenderer({ schema }: RendererProps<SelectSchema>) {
  const { data, setData } = useDataContext();
  const value = data[schema.name] || schema.defaultValue || '';

  const handleChange = (newValue: string) => {
    setData(schema.name, newValue);
  };

  return (
    <div className={cn('space-y-2', schema.className)}>
      {schema.label && (
        <Label htmlFor={schema.name}>
          {schema.label}
          {schema.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <Select value={value} onValueChange={handleChange} disabled={schema.disabled}>
        <SelectTrigger id={schema.name}>
          <SelectValue placeholder={schema.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {schema.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {schema.description && (
        <p className="text-sm text-muted-foreground">
          {schema.description}
        </p>
      )}
    </div>
  );
}
```

### Checkbox Component
Boolean toggle input.

**Schema**:
```json
{
  "type": "checkbox",
  "name": "agree",
  "label": "I agree to the terms and conditions",
  "required": true
}
```

**Implementation**:
```tsx
import { Checkbox as ShadcnCheckbox } from '@/ui/checkbox';
import { Label } from '@/ui/label';
import { useDataContext } from '@object-ui/react';

export function CheckboxRenderer({ schema }: RendererProps<CheckboxSchema>) {
  const { data, setData } = useDataContext();
  const checked = data[schema.name] || schema.defaultValue || false;

  const handleChange = (newChecked: boolean) => {
    setData(schema.name, newChecked);
  };

  return (
    <div className={cn('flex items-center space-x-2', schema.className)}>
      <ShadcnCheckbox
        id={schema.name}
        checked={checked}
        onCheckedChange={handleChange}
        disabled={schema.disabled}
        required={schema.required}
        aria-required={schema.required}
      />
      
      {schema.label && (
        <Label 
          htmlFor={schema.name}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {schema.label}
          {schema.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
    </div>
  );
}
```

### Button Component
Action trigger button.

**Schema**:
```json
{
  "type": "button",
  "label": "Submit",
  "variant": "primary",
  "size": "default",
  "loading": false,
  "onClick": {
    "type": "action",
    "name": "submitForm"
  }
}
```

**Implementation**:
```tsx
import { Button as ShadcnButton } from '@/ui/button';
import { useAction, useExpression } from '@object-ui/react';
import { Loader2 } from 'lucide-react';

export function ButtonRenderer({ schema }: RendererProps<ButtonSchema>) {
  const handleAction = useAction();
  const loading = useExpression(schema.loading, {}, false);

  const handleClick = () => {
    if (schema.onClick && !loading) {
      handleAction(schema.onClick);
    }
  };

  return (
    <ShadcnButton
      variant={schema.variant}
      size={schema.size}
      disabled={schema.disabled || loading}
      className={schema.className}
      onClick={handleClick}
      type={schema.type === 'submit' ? 'submit' : 'button'}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {schema.label}
    </ShadcnButton>
  );
}
```

### Radio Group Component
Single selection from multiple options.

**Schema**:
```json
{
  "type": "radio",
  "name": "plan",
  "label": "Select a plan",
  "options": [
    { "value": "free", "label": "Free" },
    { "value": "pro", "label": "Pro" },
    { "value": "enterprise", "label": "Enterprise" }
  ]
}
```

**Implementation**:
```tsx
import { RadioGroup, RadioGroupItem } from '@/ui/radio-group';
import { Label } from '@/ui/label';
import { useDataContext } from '@object-ui/react';

export function RadioRenderer({ schema }: RendererProps<RadioSchema>) {
  const { data, setData } = useDataContext();
  const value = data[schema.name] || schema.defaultValue || '';

  const handleChange = (newValue: string) => {
    setData(schema.name, newValue);
  };

  return (
    <div className={cn('space-y-2', schema.className)}>
      {schema.label && (
        <Label>
          {schema.label}
          {schema.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <RadioGroup value={value} onValueChange={handleChange} disabled={schema.disabled}>
        {schema.options?.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`${schema.name}-${option.value}`} />
            <Label htmlFor={`${schema.name}-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
      
      {schema.description && (
        <p className="text-sm text-muted-foreground">
          {schema.description}
        </p>
      )}
    </div>
  );
}
```

## Development Guidelines

### Data Binding

Always use `useDataContext` for two-way binding:

```tsx
// ✅ Good: Two-way binding
const { data, setData } = useDataContext();
const value = data[schema.name] || '';

const handleChange = (e) => {
  setData(schema.name, e.target.value);
};

// ❌ Bad: Local state
const [value, setValue] = useState('');
```

### Validation

Support schema-based validation:

```tsx
const validate = () => {
  if (schema.required && !value) {
    return 'This field is required';
  }
  
  if (schema.validation?.type === 'email' && !isValidEmail(value)) {
    return schema.validation.message || 'Invalid email';
  }
  
  return null;
};
```

### Accessibility

```tsx
// ✅ Good: Accessible form field
<input
  id={schema.name}
  name={schema.name}
  aria-required={schema.required}
  aria-invalid={!!error}
  aria-describedby={`${schema.name}-description`}
/>

<p id={`${schema.name}-description`}>
  {schema.description}
</p>

{error && (
  <p role="alert" className="text-destructive">
    {error}
  </p>
)}
```

### Loading States

Support loading states for async operations:

```tsx
<button disabled={loading || schema.disabled}>
  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {schema.label}
</button>
```

## Testing

```tsx
describe('InputRenderer', () => {
  it('updates data context on change', () => {
    const schema = {
      type: 'input',
      name: 'email',
      label: 'Email'
    };

    const { getByLabelText } = render(
      <DataProvider data={{}}>
        <SchemaRenderer schema={schema} />
      </DataProvider>
    );

    const input = getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'test@example.com' } });

    expect(input).toHaveValue('test@example.com');
  });

  it('shows required indicator', () => {
    const schema = {
      type: 'input',
      name: 'email',
      label: 'Email',
      required: true
    };

    render(<SchemaRenderer schema={schema} />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
```

## Common Patterns

### Form with Validation

```json
{
  "type": "form",
  "fields": [
    {
      "type": "input",
      "name": "email",
      "label": "Email",
      "required": true,
      "validation": { "type": "email" }
    },
    {
      "type": "input",
      "name": "password",
      "label": "Password",
      "inputType": "password",
      "required": true,
      "validation": { "minLength": 8 }
    },
    {
      "type": "button",
      "label": "Submit",
      "variant": "primary",
      "onClick": { "type": "action", "name": "submitForm" }
    }
  ]
}
```

## Checklist

- [ ] Two-way data binding with `useDataContext`
- [ ] Validation support
- [ ] Accessible labels and ARIA attributes
- [ ] Loading states
- [ ] Error messages
- [ ] Required indicators
- [ ] Tests added

---

**Principle**: Forms are **controlled** by data context and **validated** by schemas.
