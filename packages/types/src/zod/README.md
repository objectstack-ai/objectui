# ObjectUI Zod Validation Schemas

Complete Zod validation schemas for all ObjectUI components, following the @objectstack/spec UI specification format.

## Overview

This directory contains runtime validation schemas using [Zod](https://github.com/colinhacks/zod) for all ObjectUI component types. These schemas provide:

- **Type-safe runtime validation** of component configurations
- **Compliance with @objectstack/spec** UI specification format  
- **Auto-completion and IntelliSense** through TypeScript integration
- **Detailed error messages** for invalid configurations

### `ListViewSchema` is derived from `@objectstack/spec` (not hand-written) — #2231

`ListViewSchema` (`objectql.zod.ts`) is **composed from** the spec's
`@objectstack/spec/ui` `ListViewSchema`: spec-owned fields flow in by reference
(`BaseSchema.extend(SpecListViewFields.shape)`), so they track the protocol automatically.
Only the component envelope (`type: 'list-view'` + `objectName`), the legacy objectui
vocabulary (`viewType`/`fields`/`filters`/`show*`/`densityMode`/…), and the handful of
configs whose objectui shape is intentionally broader than spec's (`userFilters`,
`sharing`, `aria`, `conditionalFormatting`, and the per-view-type
`kanban`/`calendar`/`gantt`/`gallery`/`timeline`) are declared locally on top. The TS type
is `z.infer<typeof ListViewSchema> & ListViewRuntimeProps`. A drift-guard test
(`__tests__/list-view-spec-parity.test.ts`) fails if the spec grows a field objectui
hasn't triaged. **Do not hand-add spec-owned fields here** — import them from the spec.

### Per-view-type configs derive from the spec — #2231

`kanban` / `calendar` / `gantt` / `gallery` / `timeline` on `ListViewSchema` are the
spec's config schemas `.partial()`-ed (the product authors partial configs, and spec
marks `columns` / `titleField` / `startDateField` required). `gantt` has no local
schema at all — it flows in with the rest of `SpecListViewFields`.

Only these keys are local, and each is asserted in the drift guard:

| config | local key | why |
| :--- | :--- | :--- |
| `kanban` | `groupField`, `cardFields` | deprecated aliases for spec `groupByField` / `columns` |
| `calendar` | `defaultView` | no spec counterpart — promote it rather than growing this |
| `gallery` | `imageField` | deprecated alias for spec `coverField` |
| `timeline` | `dateField` | deprecated alias for spec `startDateField` |

**The spec key is canonical and wins at every read-site.** The aliases exist so stored
view metadata keeps validating; don't author new metadata with them, and don't add a
new alias here — rename at the producer instead.

### Spec sub-schemas are re-exported by reference (not mirrored) — #2231

The schemas that used to be hand-written "mirrors" of `@objectstack/spec/ui` are now the
spec's schemas **by reference**, so they cannot drift:

- `objectql.zod.ts`: `HttpMethodSchema`, `HttpRequestSchema`, `ViewDataSchema`,
  `ListColumnSchema`, `SelectionConfigSchema`, `PaginationConfigSchema` are direct
  re-exports. `ListColumnSchema` used to add two objectui-only fields on top of the
  spec base; spec v17 promoted both upstream (objectui#2231) — `summary` now accepts
  the `{ type, field }` object form natively and `prefix` is the spec's
  `ColumnPrefixSchema` — so the extension collapsed into a plain re-export.
- `theme.zod.ts`: `ColorPaletteSchema`, `TypographySchema`, `BorderRadiusSchema`,
  `ShadowSchema`, `AnimationSchema`, `ZIndexSchema`, `ThemeModeSchema`,
  `ThemeDefinitionSchema` all resolve to the spec's schemas. `SpacingSchema`,
  `BreakpointsSchema` and `ThemeLogoSchema` are gone: spec v17 pruned the
  never-enforced `spacing` / `breakpoints` / `logo` Theme keys (objectstack#3494),
  and re-exports by reference leave when the referent does.

A drift-guard test (`__tests__/spec-subschema-parity.test.ts`) asserts reference
identity — a faithful copy fails it too, because a copy is a fork. **Do not re-fork
these**: fix or extend the schema upstream in `@objectstack/spec`. The `ListColumn`
history is the worked example of why: the two local extensions were each tagged
"promote this upstream rather than grow the extension", and once the spec adopted
them the local code deleted itself. A local `.extend()` is a last resort for a
genuinely objectui-only renderer concern, and it should be born with that same note.

## Installation

The Zod schemas are included in the `@object-ui/types` package:

```bash
npm install @object-ui/types zod
# or
pnpm add @object-ui/types zod
```

## Usage

### Basic Validation

```typescript
import { ButtonSchema, InputSchema } from '@object-ui/types/zod';

// Validate a button configuration
const buttonConfig = {
  type: 'button',
  label: 'Click Me',
  variant: 'secondary',
};

const result = ButtonSchema.safeParse(buttonConfig);

if (result.success) {
  console.log('Valid config:', result.data);
} else {
  console.error('Validation errors:', result.error);
}
```

> ⚠️ Two refusals this first example used to walk straight into, both made **by
> name** by the schema (objectui#9522):
>
> - **`variant` is an enum.** `ButtonSchema`'s own declaration in `form.zod.ts`
>   is the list of accepted values — `'primary'` is not among them. A spelling
>   outside the enum is rejected exactly the way the *Error Messages* section
>   below shows.
> - **There is no `onClick`** — nor any other `on*` handler key on this surface.
>   JSON has no function value, so those keys are declared as refusals
>   (`handlerKeyRefusal`, objectui#6124) and every authored value is rejected,
>   an object and a live function alike. The refusal message carries the remedy:
>   author behaviour as a **node type** — an `action:` node with a declared
>   action. ⛔ Not as an `events` key either: `BaseSchema` declares none and
>   nothing reads one.
>
> Both are pinned against this page by
> `__tests__/zod-readme-examples-9522.test.ts`, which re-extracts every worked
> example below and re-runs it through the schema it names.

### Form Validation

```typescript
import { FormSchema } from '@object-ui/types/zod';

const formConfig = {
  type: 'form',
  fields: [
    {
      name: 'email',
      label: 'Email',
      type: 'input',
      inputType: 'email',
      required: true,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'input',
      inputType: 'password',
      required: true,
    },
  ],
  submitLabel: 'Sign In',
  layout: 'vertical',
};

const result = FormSchema.safeParse(formConfig);
```

### Runtime Type Inference

```typescript
import { z } from 'zod';
import { ButtonSchema, InputSchema } from '@object-ui/types/zod';

// Infer TypeScript type from schema
type Button = z.infer<typeof ButtonSchema>;
type Input = z.infer<typeof InputSchema>;
```

### Generic Component Validation

```typescript
import { AnyComponentSchema } from '@object-ui/types/zod';

function validateComponent(config: unknown) {
  const result = AnyComponentSchema.safeParse(config);
  
  if (!result.success) {
    throw new Error(`Invalid component: ${result.error.message}`);
  }
  
  return result.data;
}
```

## Available Schemas

### Base Schemas
- `BaseSchema` - Foundation for all components
- `SchemaNodeSchema` - Recursive schema node type

### Layout Components (18)
- `DivSchema`, `BoxSchema`, `SpanSchema`, `TextSchema`
- `ImageSchema`, `IconSchema`, `SeparatorSchema`
- `ContainerSchema`, `FlexSchema`, `StackSchema`
- `GridSchema`, `CardSchema`, `TabsSchema`
- `ScrollAreaSchema`, `ResizableSchema`
- `AspectRatioSchema`, `PageSchema`

### Form Components (17)
- `ButtonSchema`, `InputSchema`, `TextareaSchema`
- `SelectSchema`, `CheckboxSchema`, `RadioGroupSchema`
- `SwitchSchema`, `ToggleSchema`, `SliderSchema`
- `FileUploadSchema`, `DatePickerSchema`, `CalendarSchema`
- `InputOTPSchema`, `ComboboxSchema`, `LabelSchema`
- `CommandSchema`, `FormSchema`

### Data Display Components (14)
- `AlertSchema`, `BadgeSchema`, `AvatarSchema`
- `ListSchema`, `TableSchema`, `DataTableSchema`
- `MarkdownSchema`, `TreeViewSchema`, `ChartSchema`
- `TimelineSchema`, `BreadcrumbSchema`
- `KbdSchema`, `HtmlSchema`, `StatisticSchema`

### Feedback Components (8)
- `LoadingSchema`, `ProgressSchema`, `SkeletonSchema`
- `ToastSchema`, `ToasterSchema`, `SpinnerSchema`
- `EmptySchema`, `SonnerSchema`

### Disclosure Components (3)
- `AccordionSchema`, `CollapsibleSchema`, `ToggleGroupSchema`

### Overlay Components (10)
- `DialogSchema`, `AlertDialogSchema`, `SheetSchema`
- `DrawerSchema`, `PopoverSchema`, `TooltipSchema`
- `HoverCardSchema`, `DropdownMenuSchema`
- `ContextMenuSchema`, `MenubarSchema`

### Navigation Components (6)
- `HeaderBarSchema`, `SidebarSchema`, `BreadcrumbSchema`
- `PaginationSchema`, `NavigationMenuSchema`, `ButtonGroupSchema`

### Complex Components (5)
- `KanbanSchema`, `CalendarViewSchema`
- `FilterBuilderSchema`, `CarouselSchema`, `ChatbotSchema`

## Schema Structure

All component schemas follow the @objectstack/spec UI specification format:

```text
{
  // Required
  type: string,              // Component type identifier
  
  // Common Optional Properties
  id?: string,               // Unique identifier
  name?: string,             // Component name
  label?: string,            // Display label
  className?: string,        // Tailwind classes
  visible?: boolean,         // Visibility control
  disabled?: boolean,        // Disabled state
  
  // Type-specific properties...
}
```

## Validation Features

### Type Safety
- Strict type checking for all properties
- Enum validation for predefined values
- Recursive validation for nested structures

### Error Messages
```typescript
import { ButtonSchema } from '@object-ui/types/zod';

const result = ButtonSchema.safeParse({
  type: 'button',
  variant: 'invalid-variant'
});

// result.error.issues:
// [
//   {
//     code: 'invalid_value',
//     values: ['default', 'secondary', ...],
//     path: ['variant'],
//     message: 'Invalid option: expected one of "default"|"secondary"|...',
//   }
// ]
//
// Note: the accessor is `.issues`. Zod 4 removed the `.errors` alias, so
// `.errors` reads `undefined` rather than throwing at the access itself.
```

### Nested Validation
```typescript
import { CardSchema } from '@object-ui/types/zod';

// Validates nested components in Card
const cardWithChildren = CardSchema.parse({
  type: 'card',
  title: 'My Card',
  children: [
    { type: 'text', content: 'Hello' },
    { type: 'button', label: 'Click' }
  ]
});
```

## Best Practices

1. **Use safeParse()** for user input validation
   ```typescript
   import { ButtonSchema } from '@object-ui/types/zod';

   // Whatever arrived from the form, the request body or the config file.
   declare const userInput: unknown;

   const result = ButtonSchema.safeParse(userInput);
   if (!result.success) {
     // Handle errors gracefully
   }
   ```

2. **Use parse()** for internal configurations
   ```typescript
   import { ButtonSchema } from '@object-ui/types/zod';

   // A configuration your own code produced, so a throw is the right failure.
   declare const internalConfig: unknown;

   // Throws error on invalid data
   const config = ButtonSchema.parse(internalConfig);
   ```

3. **Validate at boundaries**
   - API endpoints receiving component configs
   - Form submissions
   - Configuration file parsing
   - Component registration

4. **Combine with TypeScript types**
   ```typescript
   import type { ButtonSchema as ButtonType } from '@object-ui/types';
   import { ButtonSchema } from '@object-ui/types/zod';

   // Use type for declarations
   const config: ButtonType = { type: 'button', label: 'Save', variant: 'default' };

   // Use schema for validation
   ButtonSchema.parse(config);
   ```

## Performance

Zod schemas are designed for runtime validation:

- **Lazy evaluation** for recursive schemas (trees, menus)
- **Optional validation** - only validate when needed
- **Partial validation** - validate specific properties
- **Caching** - Zod internally caches schema structures

## Integration Examples

### With React Hook Form
```typescript
import { FormSchema } from '@object-ui/types/zod';

// `react-hook-form` and `@hookform/resolvers` are YOUR app's dependencies, not
// this package's. These two stand in for `import { useForm } from
// 'react-hook-form'` and `import { zodResolver } from '@hookform/resolvers/zod'`
// so the schema half below is still checked against the shipped types.
declare function useForm(options: { resolver: unknown }): unknown;
declare function zodResolver(schema: unknown): unknown;

const form = useForm({
  resolver: zodResolver(FormSchema),
});
```

### With API Routes
```typescript
import { ButtonSchema } from '@object-ui/types/zod';

export async function POST(req: Request) {
  const body = await req.json();
  const result = ButtonSchema.safeParse(body);
  
  if (!result.success) {
    return Response.json(
      { error: result.error },
      { status: 400 }
    );
  }
  
  // Process valid data
  return Response.json(result.data);
}
```

### With Component Registry
```typescript
import { AnyComponentSchema } from '@object-ui/types/zod';

// Your own store of validated configurations.
declare const registry: Map<string, unknown>;

function registerComponent(config: unknown) {
  // Validate before registration
  const validated = AnyComponentSchema.parse(config);
  registry.set(validated.type, validated);
}
```

## Migration from TypeScript-only Types

If you're currently using only TypeScript types:

Before — the type alone, checked only where the literal is written:

```typescript
import type { ButtonSchema } from '@object-ui/types';

const button: ButtonSchema = { type: 'button', label: 'Save' };
```

After — the same literal, plus a runtime check at the boundary. Import the type
under an alias, because the Zod twin ships under the same name:

```typescript
import type { ButtonSchema as ButtonType } from '@object-ui/types';
import { ButtonSchema } from '@object-ui/types/zod';

const button: ButtonType = { type: 'button', label: 'Save' };
const validated = ButtonSchema.parse(button);
```

## Contributing

When adding new component types:

1. Define TypeScript interface in `src/`
2. Create corresponding Zod schema in `src/zod/`
3. Export from `src/zod/index.zod.ts`
4. Add tests in `examples/zod-validation-example.ts`
5. Update this README

## License

MIT - Copyright (c) 2024-present ObjectStack Inc.
