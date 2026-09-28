---
'@object-ui/plugin-view': patch
---

The registered `object-view` renderer reads a named grid view's own grid members off the named view (objectui#10885).

`object-view` is registered without a `renderListView`, so an authored node, and the Studio's view preview (which renders a stored view through `SchemaRenderer`), draws a grid view as the `object-grid` node `ObjectView` builds for `ObjectGrid`. That node read `columns`, `filter`, `sort`, `grouping` and `rowColor` off the active named view and nothing else, so a stored or authored grid view's `rowHeight`, `pagination` and the rest were accepted and not shown.

It now also reads, off the active named view first, ten members the protocol declares under the same name on both a named view and `object-grid` and that `ObjectGrid` reads: `pagination`, `selection`, `rowHeight`, `resizable`, `searchableFields`, `conditionalFormatting`, `rowActions`, `bulkActions`, `bulkActionDefs` and `exportOptions`. `pagination` and `selection` still fall back to the node's `table` when the named view omits them; the others have no node fallback on this path, as before. Three other members declared on both, `label`, `data` and `navigation`, are still not read off the named view on this path.

A named view's `hiddenFields` is applied the way the protocol composes it: the hidden fields are removed from the column projection the grid receives. Only a declared projection is narrowed; with no `columns` anywhere the grid still derives its own.

What moves: only a grid view that authors one of these members. A named view that carries none of them renders exactly as before, and the host `renderListView` delegation is unchanged.

`Clause-②: no` — no declared type, accepted key or published export moves. A renderer starts honouring members the spec already declares on a named view and the grid already reads.
