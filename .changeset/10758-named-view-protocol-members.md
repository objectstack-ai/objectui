---
'@object-ui/plugin-view': patch
---

`ObjectView`'s host delegation reads the rest of a named view's protocol members off the named view (objectui#10758).

A host that composes `ObjectView` with both `listViews` and its own `renderListView` receives a `list-view` node for the active view. Twenty-three members the protocol declares on a named view (`ObjectListViewSchema`) never came off the named view on that node: the delegation took them from the host `views` entry or the object-view node only, so a named view authoring one of them was accepted and rendered with some other value. This is bucket ① of the objectui#7924 ruling.

Each of them is now read off the active named view first, then the host `views` entry, then the node where that rung already read it:

- list chrome: `description`, `compactToolbar`, `allowPrinting`, `showRecordCount`, `sharing`, `aria`, `emptyState`;
- record actions: `addRecord`, `inlineEdit`, `rowActions`, `bulkActions`, `bulkActionDefs`, `exportOptions`;
- grid presentation: `rowHeight`, `pagination`, `selection`, `resizable`, `hiddenFields`, `conditionalFormatting`;
- search, filter and navigation: `searchableFields`, `filterableFields`, `userFilters`, `navigation`.

`description`, `exportOptions` and `bulkActionDefs` had no rung before and are read off the two views only, never off the node, so the objectui#5097 host-composition exemption keeps its 27 names. A named view's `rowHeight` is read as itself; the host `views` entry still goes through the density fold.

What moves for a host: where the active named view and the host `views` entry both carry one of these members, the named view's value now wins. A named view that carries none of them hands down exactly what it did before. The registered `object-view` renderer passes no `renderListView`, so an authored node is unaffected.
