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
over `{ provider: 'object' }` and what a drill-down drawer lists the underlying
records with, so those re-read too. A drill that opens a report
(`drillDown.report`) and the single-record drawer a table row opens do not
re-read. Bound rows and authored `data` rows do not subscribe.

⚠️ **Dated note, 2026-09-27 — the report a drill opens does re-read — objectui#10853.**
The sentence above that a drill opening a report (`drillDown.report`) does not
re-read stopped holding with objectui#10814 (PR objectui#10836), pending in the
same release: the drawer's `drillDown.report` arm renders `spec-report` through
`SchemaRenderer`, and the dataset report renderer's own reader re-reads it on the
bus. `drillDownReport.invalidationRefetch-10814.test.tsx` in `apps/console` pins
that through the real drawer. The single-record drawer a table row opens still
does not re-read. The rest of this entry is kept as the reading of this change.
