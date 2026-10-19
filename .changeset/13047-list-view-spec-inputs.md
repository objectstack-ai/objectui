---
'@object-ui/plugin-list': minor
---

`list-view` publishes the keys of its `@objectstack/spec` row that the renderer honours on a page node (objectui#13047).

The spec's `ComponentPropsMap` gained a `list-view` row in 18 (objectstack-ai/objectstack#22444): the list view's own `ListViewSchema`. The registration published six of its keys (`data`, `type`, `columns`, `filter`, `sort`, `options`). Every other key of the row was measured on a page node, authored in the node's `properties` and rendered through `SchemaRenderer` and this registration, and the 33 the renderer honours are now published in `inputs`, with the member shape the spec declares named in each description:

- **The query:** `pagination`, `searchableFields`.
- **Identity:** `label`, `description` (each a plain string or an inline locale map).
- **The toolbar:** `userFilters`, `userActions`, `compactToolbar`, `appearance`, `exportOptions`, `allowPrinting`, `showRecordCount`, `emptyState`.
- **The grid:** `hiddenFields`, `fieldOrder`, `rowHeight`, `resizable`, `selection`, `navigation`, `grouping`, `rowColor`, `conditionalFormatting`, `inlineEdit`, `rowActions`, `bulkActions`, `bulkActionDefs`.
- **Each kind's own block:** `kanban`, `calendar`, `gantt`, `gallery`, `timeline`, `map`, `tree`, `chart`.

`appearance.allowedVisualizations` narrows the kinds a view switcher offers, and a page node draws no switcher, so on a page it changes nothing; its description says so.

Five keys of the row stay unpublished, because the renderer does not honour them on a page node: `name` and `requiredPermissions` are read by nothing there, `sharing` and `addRecord` each draw a button that does nothing there, and `filterableFields` is read as the Filter panel's field list, not as the quick-filter shorthand the row declares it to be.

The `view:list` alias registers the same renderer and now publishes the same list. The descriptions of the six keys already published are filled in. Nothing changes at render time: no reader, export, prop or type member is added.
