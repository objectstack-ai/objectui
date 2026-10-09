---
'@object-ui/plugin-view': patch
---

An `object-view` grid now exports the filter it shows, and returns to page 1 when that filter changes (objectui#11880, item 5).

`ObjectView` hands the grid it draws one filter slot, `filter`, carrying the whole chain: the active named view's filter, else `table.filter` unless it lowers to nothing (absent, `[]` or `{}`), else the deprecated `table.defaultFilters`. It no longer writes `defaultFilters` on that grid node, which `@objectstack/spec` retires on `object-grid` (objectstack#11509).

Two user-visible corrections, both on an `object-view` rendered by the registered renderer (a page node, the Studio's stored-view preview; a host that supplies `renderListView` already behaved this way):

- **The export carries the view's filter.** A named view's filter and an authored `table.defaultFilters` narrowed the rows on screen, but the server-streamed export (CSV, XLSX, JSON) was handed no filter and downloaded every record of the object. It now downloads the rows the view shows, as it already did for `table.filter`.
- **Changing the filter returns the grid to page 1.** When a named view's filter or `table.defaultFilters` changed while the grid stayed mounted, the next query kept the old page index, which could ask for a page the new result does not have. It now returns to page 1, as `table.filter` already did.

What did not change: which filter applies (each rung and each pair sends the same query and draws the same rows), and a refused filter still draws the grid's malformed-filter panel and queries nothing. Nothing is added to or removed from any published type, schema or export.
