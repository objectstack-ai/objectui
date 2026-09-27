---
'@object-ui/plugin-dashboard': patch
---

fix(plugin-dashboard): `object-pivot` and `object-data-table` re-read on the data-invalidation bus

The fetch effects of `ObjectPivotTable` and `ObjectDataTable` now name the
`useDataInvalidation` nonce for `schema.objectName`, so a write declared on the
bus (`notifyDataChanged`, as a page action over raw HTTP does) re-reads the rows
in place. Before, both refreshed after such a write only when their host
remounted them, and `PageView` is about to stop doing that (objectui#10519).

The pivot's element-bound spelling (`dataSource: { object }`) resolves onto the
same key. The table is also what a `dashboard` block draws for a table widget
over `{ provider: 'object' }` and what every drill-down drawer lists records
with, so those re-read too. Bound rows and authored `data` rows do not
subscribe.
