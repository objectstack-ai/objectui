---
'@object-ui/types': minor
'@object-ui/fields': minor
---

The grid field's `columns` is `@objectstack/spec`'s inline grid column list, by reference, and `object-chart` declares the per-element `dataSource` binding like the other gate-wrapped blocks (objectui#11070, round 7).

- **Grid columns (`@object-ui/types`).** `GridFieldMetadata.columns` and the form-field face's `FormField.columns` (TypeScript and the zod mirror `FormFieldSchema`) are `FieldSchema.inlineColumns` by reference: an array of the spec's strict, `name`-keyed inline grid column (`InlineGridColumn`), which the spec declares as the mirror of the `grid` widget's column. The key stays `columns`: a `grid` field is objectui's own field type, and the spec spells the same list `inlineColumns` on a `master_detail` field.
- **`GridColumnDefinition` is retired (`@object-ui/types`).** Nothing read it, and it was not the shape the widget read: it required a free-form `type` and declared `defaultValue` and `validate`, which no reader consumed. Use `InlineGridColumn` from `@objectstack/spec/data`, or `NonNullable<GridFieldMetadata['columns']>[number]`.
- **`GridColumn` (`@object-ui/fields`)** is `InlineGridColumn` by reference instead of a hand-written copy. `GridField` already read each column by exactly the spec's keys (twenty, with no second spelling), so nothing changes at render time.
- **`object-chart` · `dataSource` (`@object-ui/types`).** `ObjectChartSchema` (TypeScript and the zod mirror) and the authored arm `ObjectChartBlockSchema` declare `dataSource` as the spec's `ElementDataSourceSchema`, by reference, at node level beside the `properties` bag, as `ObjectFormBlockSchema` and `ObjectMapBlockSchema` do. The registration is gate-wrapped, so `ElementDataSourceGate` reads the binding off the node and lands its `object` on `objectName`; the react-page wrapper no longer writes the host adapter under that key (objectui#11070, round 2).

**Clause-②: yes (narrowing).** The strict face's accept set widens: a grid field's `columns` and an `object-chart` node's `dataSource` binding used to be refused by name there and now parse. The tolerant face narrows, because both keys are now judged by their declared type on both faces:

- a grid column the spec refuses is refused: the retired `field` spelling, a `title`, a per-column `defaultValue`, a `type` outside the nine cell controls (`text`, `number`, `currency`, `date`, `datetime`, `time`, `select`, `lookup`, `file`), or a `scale` on a column declaring `type: 'currency'`. `FormFieldSchema` strips an undeclared key, so before this change such a column list was dropped from the parsed field in silence;
- an `object-chart` node whose `dataSource` is not a binding is refused, `null` or an adapter object included. The authored arm is `.passthrough()`, so before this change that value was kept unjudged.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

- **TypeScript.** `import type { GridColumnDefinition } from '@object-ui/types'` no longer resolves. A grid column literal typed `GridFieldMetadata['columns']`, `FormField['columns']` or `GridColumn` that carries a key the spec column does not declare, or a `type` outside the nine, is a compile error. A `readonlyWhen` / `requiredWhen` written as an object must name its `dialect`, as the spec's expression envelope does. An `ObjectChartSchema` literal whose `dataSource` holds an adapter is a compile error; pass the adapter as the component's `dataSource` prop, or through `SchemaRendererProvider`.
- **Validation.** The documents above that the tolerant face (`safeValidateSchema`, and so `objectui validate`) accepted are refused. Fix: write the spec's column keys (`name`, `label`, `type`, …), or drop a key the column does not have; write a binding (`{ "object": "…" }`) or no `dataSource` on an `object-chart` node.

Rendering does not change: `GridField` reads the same keys as before, and `ElementDataSourceGate` ignores a value that is not a binding.
