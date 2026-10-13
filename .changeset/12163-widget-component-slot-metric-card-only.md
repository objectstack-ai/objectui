---
'@object-ui/types': minor
---

A dashboard widget's legacy `component` envelope takes a `metric-card` node only, and refuses every other node by name with the fix, on both zod faces and on the TypeScript type (objectui#12163, ruling C).

BREAKING (`@object-ui/types`): a widget whose `component` holds any node other than a `metric-card` (a `custom` widget's `text`, `statistic`, `chart`, `card`, …, or a primitive) is now refused by `objectui validate`, `objectui check`, `safeValidateSchema`, and `tsc` against `DashboardWidgetSchema`. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

- FROM `{ "id": "w", "type": "custom", "component": { "type": "text", "content": "Revenue is up" } }`
- TO a widget in the spec form, bound to a dataset (ADR-0021): `{ "id": "w", "type": "bar", "dataset": "invoices", "dimensions": ["region"], "values": ["amount"] }`, or a `metric-card` in the slot: `{ "id": "w", "component": { "type": "metric-card", "title": "Revenue", "value": "$1.2M" } }`

Why: the slot's second arm was passthrough `BaseSchema`. The strict authoring face closed it to the base keys, so a `text` node's `content` (or a `statistic` node's `value`) was refused as an unrecognized key, which told an author to empty a node the renderer draws. `@objectstack/spec` declares neither this envelope nor a `custom` widget, the one component node the 2026-08-14 slot ruling admits is `metric-card` (objectstack#8593), and the director's ruling on objectui#12163 (letter C) keeps the slot at that node and has it say so.

What each face does now, FROM → TO:

- **zod, strict authoring face (`StrictAnyComponentSchema`, `objectui validate` / `objectui check`).** NARROWS. A non-`metric-card` node carrying base keys only (`{ "type": "text", "className": "x" }`, `{ "type": "statistic", "label": "Revenue" }`) used to parse; it is refused now. A node carrying its own keys (`text` / `content`, `statistic` / `value`, `chart` / `chartType`) was refused for those keys as `unrecognized_keys`; it is refused now as a node: one `custom` issue at `component` that names the node it refuses and gives the fix. No `unrecognized_keys` and no `invalid_union` come back from the slot any more.
- **zod, tolerant face (`AnyComponentSchema`, `safeValidateSchema`).** NARROWS. Any non-`metric-card` node used to parse, every key kept; it is refused now with the same one issue. A primitive was already refused there, and is now refused by name too.
- **TypeScript.** NARROWS. `DashboardWidgetSchema['component']` goes from `DashboardWidgetSlotComponentSchema | SchemaNode` to `DashboardWidgetSlotComponentSchema`.
- **Unchanged.** A `metric-card` in the slot is judged by the component arm alone, exactly as since objectui#11709: a refused key is refused at that key, and `layout` parses. The dashboard renderers (`DashboardRenderer`, `DashboardGridLayout`) are not touched: a stored envelope node still draws as it did.

**Migration.** Bind the widget to a dataset in the spec form (a chart-family `type` with `dataset`, `dimensions` and `values`), or, for a single figure, put a `metric-card` node with its `value` in the slot.

Nothing widens, and no export is added. The refusal arm is module-private, like the component arm.
