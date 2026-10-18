---
'@object-ui/types': minor
---

A page `list-view` node is judged in its `properties` bag, in `@objectstack/spec`'s list view spelling, and the retired `objectName` / `viewType` are refused by name (objectui#12670; ruling C on objectstack-ai/objectstack#22444).

```json
{
  "type": "list-view",
  "properties": {
    "data": { "provider": "object", "object": "deal" },
    "type": "kanban",
    "kanban": { "groupByField": "stage" }
  }
}
```

- **zod (`@object-ui/types/zod`).** The `list-view` arm of `AnyComponentSchema` is the new `ListViewBlockSchema`, so `safeValidateSchema`, `StrictAnyComponentSchema` and `objectui validate` judge a page node by its bag. The bag's members are `ListViewSchema`'s own, by reference (the spec has no `ComponentPropsMap['list-view']` row), with the list kind as the bag's `type`, the spec's view-kind enum. The record source is `properties.data` or the node's `dataSource.object`; with neither, the node is refused with `RECORD_SOURCE_REQUIRED` at `properties.data`. The spec's `checkListViewCalendarVisualization` and `checkListViewChartBinding` run in the bag, so a `chart` list with no dataset binding is refused at `properties.chart`, as the spec's list view refuses it.
- `ListViewBlockSchema` reaches `AnyComponentSchema` through `ObjectQLPublicBlockComponentSchema`, the public block union. `ListViewSchema` leaves `ObjectQLComponentSchema`, so `ObjectQLComponentSchema.safeParse` of a `list-view` node now fails on the discriminator.
- **TypeScript.** `ListViewBlockNode` is exported: the authored page node, its bag closed. `ListViewSchema` (zod and TypeScript) is unchanged and stays the `ListView` component's props, `objectName` / `viewType` included; it is no longer an arm of the zod `ObjectQLComponentSchema` union.

BREAKING (`@object-ui/types`), for a page `list-view` node in the old spelling:

- `objectName`, flat or in `properties`, is refused by name. Write `properties.data: { "provider": "object", "object": "…" }`, or bind the object with the node's `dataSource.object`.
- `viewType`, flat or in `properties`, is refused by name. Write `properties.type`.
- Any other list view prop written flat on the node (`columns`, `filter`, `kanban`, …) is refused by name. Move it into `properties`, as `@objectstack/spec`'s own page component already requires.
- Code that parses with `ObjectQLComponentSchema` directly no longer accepts any `list-view` node. Parse a page node with `AnyComponentSchema`, whose `list-view` arm is `ListViewBlockSchema`, and the `ListView` component's props with `ListViewSchema`, which is still exported.

The ruling carries stored page nodes in the old spelling by an ADR-0087 conversion in `@objectstack/spec` (objectstack-ai/objectstack#22444), never by a fallback read in objectui. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)
