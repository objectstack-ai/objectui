---
'@object-ui/types': minor
---

feat(types): an authored `object-grid` takes its props in the spec's `properties` bag; the flat spelling is refused by name (objectui#11276)

**BREAKING (authoring):** an `object-grid` node that writes its props on the node itself is now refused by `safeValidateSchema`, `validateSchema` and the strict authoring face, and so by `objectui validate`. Move each prop into the node's `properties` bag:

```json
{ "type": "object-grid", "properties": { "objectName": "task", "columns": ["title", "status"], "sort": [{ "field": "title", "order": "asc" }] } }
```

Nothing changes at render time: `SchemaRenderer` hoists every `properties` key onto the node before `ObjectGrid` runs, so the bag node draws what the flat one drew, and a stored flat node, or a node built in code (`ObjectView`, `ListView`, the designers, a host mounting `<ObjectGrid schema={…}>`), keeps working with its flat keys.

**Clause-②: yes** — the accept set narrows (a flat `object-grid` node that parsed is refused) and widens (a spec-shaped bag node that was refused parses). Released as `minor` under the objectui narrowing rule, with this banner.

**Why.** `@objectstack/spec`'s `ComponentPropsMap['object-grid']` row is the published declaration of an authored `object-grid` node's props, and the spec's own strict `PageComponentSchema` refuses a prop written on the node as mis-layered (ADR-0089 D3a). The arm here was the flat mirror of the TypeScript `ObjectGridSchema`, so the two validators disagreed both ways: the objectstack showcase's work queues, written in the bag, were refused (the flat mirror found no `objectName` on the node), and the flat node `os validate` refuses was accepted.

**What changed, in observable terms.**

- `@object-ui/types/zod` exports `ObjectGridBlockSchema`, built the way `ObjectGanttBlockSchema` is: `BaseSchema`, the `object-grid` literal, the node-level `responsiveStyles`, the node's `dataSource` binding (the spec's `ElementDataSourceSchema`), and `properties`, which is the spec row by reference, so the row's members, value types and strictness judge the bag.
- Each member of the row written flat on the node is refused on both faces, with a message that names its bag member (`Did you mean \`objectName\` → \`properties.objectName\`?`). The refusal set is read off the row. `label` stays on the node too, because the spec's page component declares a node-level `label`; a flat `defaultSort` keeps the row's own retirement message. `operators`, `rowSpecActions`, `bulkSpecActions`, `name`, `placeholder` and `showFilters` keep their retirement messages, `onNavigate` stays a refused runtime slot, and `body` / `children` stay refused (objectui#9256).
- The record-source rule stays, read in the bag: the node needs `properties.objectName`, or a `dataSource` binding naming the object. The spec has no such rule.
- `ObjectGridBlockSchema` reaches `AnyComponentSchema` through `ObjectQLPublicBlockComponentSchema`. `ObjectGridSchema` leaves `ObjectQLComponentSchema`.
- Inside the bag the spec row decides, and it differs from the flat mirror. `filter` and `defaultFilters` take the `ViewFilterRule` array only (`[{ field, operator, value }]`), so the tuple form, the record form and a record-form `defaultFilters` are refused there. The row types `columns` entries, `selection`, `exportOptions`, `operations`, `navigation`, `grouping` and a few display keys as unknown, so their shapes are not judged inside the bag: notably a bare-array `exportOptions`, which the flat mirror refuses by name (objectui#7762), is not refused there. The row declares keys the flat mirror does not (`rowHeight`, `grouping`, `aggregations`, `conditionalFormatting`, `rowColor`, `bulkActionDefs`, `navigation`, `singleClickEdit`, `resizableColumns`, `reorderableColumns`, `operations`), so they parse in the bag. It does not declare `emptyState` or `keyboardNavigation`, so the bag refuses them, and on the node the strict face refuses them as unknown keys: `emptyState` is not authorable in a document until the spec's row declares it.

**The same release's changesets** that describe what the validators say about an `object-grid` written flat (`.changeset/7762-object-grid-export-options-bare-array-refusal.md`, `.changeset/9739-object-grid-operators-tombstone.md`, `.changeset/11068-grid-declared-keys.md`, `.changeset/11068-object-grid-show-filters.md`, `.changeset/11117-datasource-objectname-waiver.md`, `.changeset/10872-flat-arm-responsive-styles.md` and others) describe the flat mirror, which still behaves as they say. On an authored node the props now live in the bag, where the spec row judges them as listed above; the retirements, the record-source rule and `responsiveStyles` hold there as they say.

**What did not move.** The TypeScript `ObjectGridSchema` and its zod mirror `ObjectGridSchema` stay published and unchanged in shape. They are the node as `ObjectGrid` reads it after the hoist, and as code composes it, and the `object-view` `table` slot is still built from the mirror.

**Correction, 2026-10-02 (objectui#6152, round 6).** The list above of keys "the row declares and the flat mirror does not" is no longer true for ten of them: the flat `ObjectGridSchema` mirror now declares `rowHeight`, `grouping`, `aggregations`, `conditionalFormatting`, `rowColor`, `bulkActionDefs`, `navigation`, `singleClickEdit`, `reorderableColumns` and `operations`, each typed as its TypeScript twin types it (`.changeset/6152-objectgrid-round6-mirrored.md`). `resizableColumns` is still the row's alone. The bag is unchanged: the spec row still judges these keys inside `properties`.

**Correction, 2026-10-03 (objectui#11227).** At `@objectstack/spec` 17.6.0 the row declares
`description`, `emptyState` and `keyboardNavigation`, so the sentence above saying it does not
declare `emptyState` or `keyboardNavigation` no longer holds. All three parse in the bag, and
each written flat on the node is refused by name toward its bag member, like the row's other
members. `emptyState` is authorable in a document, and so is `description`, which no longer
stays on the node beside the bag (`.changeset/11227-object-grid-17-6-keys.md`).
