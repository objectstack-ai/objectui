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
`sharing`, `aria`, and the per-view-type
`kanban`/`calendar`/`gantt`/`gallery`/`timeline`) are declared locally on top.
`conditionalFormatting` is declared locally too, but it is no longer broader than spec
(objectui#11533): it is the spec list view's own `{ condition, style }` rule, by
reference, with objectui's string `condition` arm and the retired native dialect
(`field`/`operator`/`value`, `expression`, top-level colours) refused by name. The grid's
`ObjectGridSchema` shares the same rule. The TS type
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
- `ContainerSchema`, `FlexSchema`, `FlexBlockSchema`, `StackSchema`
- `GridSchema`, `CardSchema`, `TabsSchema`
- `ScrollAreaSchema`, `ResizableSchema`
- `AspectRatioSchema`, `PageSchema`, `PageKindNodeSchema`

`PageKindNodeSchema` (objectui#11440) is a stored `@objectstack/spec` page whose `type` is its page kind, `record`, `home` or `utility`: the spelling the spec's `PageSchema` declares, and the node `PageView` hands to the renderer. `@object-ui/components` registers the three kinds on the `page` node's renderer, so every member is `PageNodeSchema`'s own, by reference, and `type` is the spec's `PageTypeSchema` narrowed to those three. The spec's other two kinds are claimed elsewhere: `app` by the app document's arm, and `list` by the `list` component. Which spelling of a page is canonical is not decided here; `{ type: 'page', pageType }` validates as before.

`FlexBlockSchema` is the authored `flex` node (objectui#11276's `flex` batch, the maintainer's ruling A on objectui#11300), built the way `ObjectChartBlockSchema` is: `@objectstack/spec` has no `ComponentPropsMap['flex']` row, so the bag's `direction`, `justify`, `align`, `gap` and `wrap` are the flat `FlexSchema` mirror's own members, by reference, and no row is invented. The child list is in the bag too, as `properties.children`: one node or a list, the list's entries judged by the spec's page walk like a `page:` container's. Each bag member written flat on the node is refused by name, naming `properties.KEY`, and `body` is refused toward `properties.children`. `FlexSchema` stays exported as the node as the `flex` renderer reads it after the hoist, and as code composes it; it is no longer an arm of `AnyComponentSchema`. `stack` and the other layout arms keep their props on the node.

### Form Components (17)
- `ButtonSchema`, `InputSchema`, `TextareaSchema`
- `SelectSchema`, `CheckboxSchema`, `RadioGroupSchema`
- `SwitchSchema`, `ToggleSchema`, `SliderSchema`
- `FileUploadSchema`, `DatePickerSchema`, `CalendarSchema`
- `InputOTPSchema`, `ComboboxSchema`, `LabelSchema`
- `CommandSchema`, `FormSchema`

### Data Display Components (15)
- `AlertSchema`, `BadgeSchema`, `AvatarSchema`
- `ListSchema`, `TableSchema`, `DataTableSchema`
- `MarkdownSchema`, `TreeViewSchema`, `ChartSchema`
- `TimelineSchema`, `BreadcrumbSchema`, `PivotTableSchema`
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

### ObjectQL Public Blocks (10)
The ADR-0080 public blocks `object-metric`, `object-master-detail-form`, `object-timeline`, `object-form`, `object-map`, `object-chart`, `object-gantt` and `object-grid`. Every arm's `properties` but `object-chart`'s is the block's `@objectstack/spec` `ComponentPropsMap` row, by reference; `object-chart` has no row (below). Each of those seven arms also declares the node's `dataSource` binding, the spec's `ElementDataSourceSchema`, which all seven registrations read through `ElementDataSourceGate`. None of the eight renderers reads a content channel, so every arm refuses `children` and `body` by name (objectui#9256). On all eight, a member of the row written flat on the node instead of in `properties` is refused by name, naming `properties.KEY`: `object-metric`, `object-master-detail-form`, `object-timeline` and `object-grid` through the public blocks' shared helper since objectui#10872 batch 10 (below), the other four through their own maps.
`ObjectFormBlockSchema` is the authored `object-form` node (objectui#10859 batch 4): its props go in the `properties` bag, and each member of the row written flat on the node is refused by name, with a message naming `properties.KEY`. `ObjectFormSchema`, the flat mirror of the TypeScript `ObjectFormSchema`, stays exported as the node as `ObjectForm` reads it after `SchemaRenderer` hoists the bag; it is no longer an arm of `AnyComponentSchema`.
`ObjectMapBlockSchema` is the authored `object-map` node, built the same way (objectui#10859 batch 5). The flat mirror's `locationField` and `titleField` are refused by name too, pointing at `properties.map.KEY`. The flat mirror's record-source rule stays, read in the bag: the node needs one of `properties.data`, `properties.staticData` or `properties.objectName`, or the node's `dataSource` binding. `ObjectMapSchema`, the flat mirror of the TypeScript `ObjectMapSchema`, stays exported as the node as `ObjectMap` reads it; it is no longer an arm of `AnyComponentSchema`.
`ObjectChartBlockSchema` is the authored `object-chart` node (objectui#11276), built the same way with one difference: `@objectstack/spec` has no `ComponentPropsMap['object-chart']` row, so the bag's members are the flat `ObjectChartSchema` mirror's own members, by reference, and no row is invented. Each of them written flat on the node is refused by name, naming `properties.KEY`; the three list-view spellings objectui#10608 retired keep their retirement message instead. The flat mirror's chart-family floor stays, read in the bag: the node needs `properties.chartType` (or `properties.specType`). It does not declare `dataSource` (objectui#11070 left that binding undeclared on this node) and refuses both content channels. `ObjectChartSchema` stays exported as the node as `ObjectChart` reads it, and as the composers build it; it is no longer an arm of `AnyComponentSchema`.
`ObjectGanttBlockSchema` is the authored `object-gantt` node, built the way `ObjectMapBlockSchema` is (objectui#10859 batch 6). Each member of the row written flat on the node is refused by name, naming `properties.KEY`, except `label`, which `@objectstack/spec`'s page component also declares on the node itself. The flat mirror's `GanttConfig` keys (`startDateField`, `viewMode`, …) and its `dependencyField` alias are refused by name too, pointing at the bag's `gantt` block, `properties.gantt.KEY`. The record-source rule stays, read in the bag, as on `object-map`. `ObjectGanttSchema`, the flat mirror of the TypeScript `ObjectGanttSchema`, stays exported as the node as `ObjectGantt` reads it, and as the list and object views compose it; it is no longer an arm of `AnyComponentSchema`.
`ObjectGridBlockSchema` is the authored `object-grid` node (objectui#11276's `object-grid` batch), built the way `ObjectGanttBlockSchema` is from the spec's `ComponentPropsMap['object-grid']` row. `label` stays on the node, as on `object-gantt`, and a flat `defaultSort` keeps the row's own retirement. The flat mirror's retirements of keys the row does not declare (`operators`, `rowSpecActions`, `bulkSpecActions`, `name`, `placeholder`, `showFilters`) and its content-channel refusals ride onto the arm by reference, and its `onNavigate` runtime slot is declared as the mirror declares it. The record-source rule stays, read in the bag: the node needs `properties.objectName`, or the node's `dataSource` binding. `ObjectGridSchema`, the flat mirror of the TypeScript `ObjectGridSchema`, stays exported as the node as `ObjectGrid` reads it, and still builds the `object-view` `table` slot; it is no longer an arm of `AnyComponentSchema`.
`ObjectPivotBlockSchema` and `EmbeddableFormBlockSchema` (objectui#11440) are the authored `object-pivot` and `embeddable-form` nodes, two more blocks with no `ComponentPropsMap` row. Each bag is built from the block's registration `inputs`, and it is required, because those inputs include required members: `rowField`, `columnField` and `valueField` on the pivot, `formId` on the form. `objectName` is required unless the node's `dataSource` binding names the object. The pivot's cross-tab members are the `PivotTableSchema` mirror's own, by reference; its `drillDown` refuses `mode` by name (a pivot always drills through), and its retired `dataProvider` is refused by name. A member written flat is refused by name toward `properties.KEY`, the node declares the `dataSource` binding, and both content channels are refused.
- `ObjectMetricBlockSchema`, `ObjectMasterDetailFormBlockSchema`, `ObjectTimelineBlockSchema`, `ObjectFormBlockSchema`, `ObjectMapBlockSchema`, `ObjectChartBlockSchema`, `ObjectGanttBlockSchema`, `ObjectGridBlockSchema`
- `ObjectPivotBlockSchema`, `EmbeddableFormBlockSchema`

### AI Components (3)
- `AIFormAssistSchema`, `AIRecommendationsSchema`, `NLQuerySchema`

### Designer Components (6)
The `@object-ui/plugin-designer` nodes (objectui#10859 batch 7). Each arm mirrors its TypeScript declaration in `designer.ts` member for member, and the record types under them (`DesignerComponentSchema`, `BPMNNodeSchema`, `ReportDesignerSectionSchema`, …) are exported beside them. `lanes` and `version` on `process-designer` are mirrored since objectui#11434 gave each a reader, with `BPMNLaneSchema` for the lane record. objectui#11434 also respelled `DataModelRelationship.onDelete` as `deleteBehavior`, in `@objectstack/spec`'s vocabulary (`set_null`, `cascade`, `restrict`): `onDelete` is refused by name with the migration. A report element's `properties` record refuses `field` by name, with the migration to the element's declared `dataBinding`, which `ReportDesigner` reads instead (objectui#11434). Members objectui#11434 retired are refused by name on both faces, each with what to write instead: `autoLayout` on `data-model-designer`, `previewMode` on `report-designer`, and the record members `DesignerComponent.parentId`, `DataModelRelationship.onUpdate`, `BPMNNode.serviceEndpoint`, `ObjectDefinition.relationships` and `DesignerFieldDefinition.validationRules`. The element types of the last two, `ObjectDefinitionRelationship` and `DesignerValidationRule`, and their mirrors left the package. None of the six components reads a content channel, so every arm refuses `children` and `body` by name (objectui#9256).
- `PageDesignerSchema`, `DataModelDesignerSchema`, `ProcessDesignerSchema`
- `ReportDesignerSchema`, `ObjectManagerSchema`, `FieldDesignerSchema`

### ADR-0080 Public Blocks (27)
Each arm's `properties` is the block's `@objectstack/spec` `ComponentPropsMap` row, by reference. `ElementNumberBlockSchema` also declares the spec's `dataSource` binding, and mirrors the spec gate's one waiver: its bag may omit `object` when `dataSource.object` names the object.
A member of an arm's row written flat on the node instead of in `properties` is refused by name on both faces, at its own path, with a message naming `properties.KEY`, as `@objectstack/spec`'s `PageComponentSchema` refuses it as mis-layered (objectui#10872 batch 10; one shared helper, `flatPropRefusals`, spread into every arm whose row declares a member). That includes the row members `BaseSchema` also declares (`visible`, `disabled`, `name`, `description`), which the base used to accept flat. Two kinds stay as they were: a member the spec's page component declares on the node itself (`label`, `aria`), and one the row retires, which keeps the row's own retirement message when written flat. An arm's own refusal of a row key (`record:alert`'s `body`, the `action:` controls' `onSuccess`, the content-channel refusals) keeps its message.
Every arm here, and each of the ObjectQL public blocks above, declares the node-level `responsiveStyles` (ADR-0065 per-breakpoint style maps, which `SchemaRenderer` compiles to scoped CSS) as the spec's `ResponsiveStylesSchema`, by reference, from one shared fragment, `NODE_ENVELOPE` (objectui#10872 batch 8; named `PUBLIC_BLOCK_ENVELOPE` until batch 9). The other node-level keys the spec's `PageComponentSchema` declares (`events`, `aria`, `visibility`, `responsive`, and `dataSource` outside the arms that read it) stay undeclared, so the strict face refuses them by name.
Outside this set, `FlexSchema`, `ObjectGridSchema` and `ObjectChartSchema` spread the same fragment (objectui#10872 batch 9; all three are post-hoist mirrors since objectui#11276, the authored arms being `FlexBlockSchema`, `ObjectChartBlockSchema` and `ObjectGridBlockSchema` above, and `FlexBlockSchema` spreads it too), and their TypeScript twins declare the key as the spec's `ResponsiveStyles`: they are the arms outside this set that objectui#10872's producer reading found `responsiveStyles` written on (a dated reading, not re-derived here). `BaseSchema` and every other arm leave it undeclared, so the strict face refuses it there by name.
Every arm except the four `page:` containers (`page:card`, `page:section`, `page:footer`, `page:sidebar`) refuses `children` and `body` by name, because its renderer reads neither content channel (objectui#9256; the last six below since objectui#10872 batch 5). The four containers do render a child list, and its home is `properties.children`, the member their spec row declares; they refuse the node-level `children` and `body` with a message naming it, as `@objectstack/spec`'s `PageComponentSchema` refuses a node-level `children` (objectui#10872 batch 6). Two carve-outs: `record:alert` refuses `children` with its own message, while its `body` is the message text and belongs in `properties`, so a flat `body` is refused with a pointer to `properties.body` rather than to `children` (objectui#10872); and `page:tabs` / `page:accordion` refuse the node's own `children` while each item's `children` in `items` stays live.
- `PageHeaderBlockSchema`, `PageTabsBlockSchema`, `PageCardBlockSchema`, `PageAccordionBlockSchema`
- `PageSectionBlockSchema`, `PageFooterBlockSchema`, `PageSidebarBlockSchema`
- `RecordDetailsBlockSchema`, `RecordHighlightsBlockSchema`, `RecordRelatedListBlockSchema`
- `RecordPathBlockSchema`, `RecordActivityBlockSchema`, `RecordDiscussionBlockSchema`
- `RecordHistoryBlockSchema`, `RecordQuickActionsBlockSchema`, `RecordReferenceRailBlockSchema`
- `RecordAlertBlockSchema`, `ElementTextBlockSchema`, `ElementNumberBlockSchema`, `ElementButtonBlockSchema`, `ElementDividerBlockSchema`
- `ElementDefinitionListBlockSchema`, `ElementRepeaterBlockSchema`
- `ActionButtonBlockSchema`, `ActionIconBlockSchema`, `ActionGroupBlockSchema`, `ActionMenuBlockSchema`

The last six arrived with `@objectstack/spec` 17.5.0, whose rows for them were measured at their renderers' reads (objectui#10872 batch 4). Their content channels were measured by the objectui#9256 method in objectui#10872 batch 5, and none of their renderers reads either one, so each refuses `children` and `body` like the arms above. The message names where the content goes instead: `properties.actions` for `action:group` and `action:menu`, `properties.items` for `element:definition-list`, and the label and icon for the two buttons. `element:repeater` has no content channel, and its message says so. `ActionButtonBlockSchema` and `ActionIconBlockSchema` also refuse two keys their renderers read off the node: `onClick`, a runtime slot for a host-supplied function (objectui#6124), and a flat `onSuccess`, pointed at `properties.onSuccess`, the row's member.

### Shell and Section Nodes
- `AppSchemaRendererNodeSchema` — `app-schema-renderer`, `@object-ui/layout`'s whole-shell node (objectui#11440). It declares its registration's three inputs: `schema`, the app document the shell draws, which is the `app` document's own arm in `app.zod.ts`, the same schema object, by reference (objectui#11494); `mobileNavMode` (`'drawer'` | `'bottom_nav'`); and `basePath`. The document is nested, `{ "type": "app-schema-renderer", "schema": { "type": "app", "navigation": [...] } }`, and keeps its own refusals there (`mobileNavMode` inside `schema` is refused, objectui#11363). Its keys written flat on the node are refused by the strict face as unrecognized keys, and the node does not draw them: one spelling. Both content channels are refused: a node draws neither.
- `DetailSectionNodeSchema` — `detail-section`, one field section of `@object-ui/plugin-detail` as a node (objectui#11440): the ten `DetailViewSectionSchema` members its registration publishes, flat on the node, `fields` required. It is not `record:details`'s section shape (that one names its heading `label` and takes field names), so it is a node of its own.

### Cloud Widgets (2)
`@object-ui/app-shell`'s `cloud:` SDUI widgets. `@objectstack/spec` has no `ComponentPropsMap` row for them, so each arm is declared here from the keys its widget reads.
- `CloudPlanStatusSchema` — `cloud:plan-status`, the pricing page's "current plan" marker: `properties` must be exactly `{ plan }`, a non-empty plan code.
- `CloudWorkspaceTimezoneNoticeSchema` — `cloud:workspace-timezone-notice`, the welcome page's line naming the workspace's seeded timezone: the widget reads no prop, so `properties` may only be `{}`. The zone comes from the organization's entitlements summary.

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

A component nested in a container's props bag is judged too, by the node union
behind `safeValidateSchema` and `StrictAnyComponentSchema`, at the positions
`@objectstack/spec`'s page walk (`walkAddressedPageComponents`) descends —
`properties.children` and `properties.items[].children` on the page containers —
and each issue lands at the nested node's real path:

```typescript
import { safeValidateSchema } from '@object-ui/types/zod';

const result = safeValidateSchema({
  type: 'page:section',
  properties: { children: [{ type: 'element:text', properties: { content: 7 } }] },
});
// result.success === false; the issue path starts
// ['properties', 'children', 0, 'properties', 'content']
```

That judgment lives on the union: a container's own arm schema parsed alone
(`PageSectionBlockSchema.safeParse(…)`) still reads its bag's child list as the
spec row types it, a list of anything.

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
