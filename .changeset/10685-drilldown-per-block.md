---
'@object-ui/types': patch
'@object-ui/plugin-dashboard': patch
---

`object-pivot` refuses `drillDown.mode` on its prop type (objectui#10685)

Refused at the TypeScript door only. A stored JSON pivot config carrying the key is still
accepted and ignored at render, as it was before: neither `object-pivot` nor
`PivotTableSchema` has a zod mirror, so no validator in this repository reads the members
of a pivot's `drillDown`.

The key never had a read site on a pivot. Every pivot click point is an aggregated bucket
(a cell, a row or column header, or a total), so the block always drills through to the
records behind the clicked value, and `mode`, which chooses drill-to-record for a clicked
row, had nothing to choose. It still type-checked on `ObjectPivotTable`'s
`schema.drillDown` and then did nothing, with no diagnostic.

- `@object-ui/types` adds `ObjectPivotDrillDownConfig`, published on the root entry
  `@object-ui/types` and on the `@object-ui/types/data-display` subpath: `DrillDownConfig`
  with a `mode?: never` tombstone whose docblock names the block that does read the key,
  `object-data-table`. The shared `DrillDownConfig` keeps `mode` for that block, and its
  `mode` docblock now names only that block instead of charts, pivot tables and metric
  cards, none of which read it.
- `@object-ui/plugin-dashboard` types `ObjectPivotTable`'s `schema.drillDown` with it, and
  the component reads its drill config through that type instead of through `any`.

TSX code that passes `mode` inside `ObjectPivotTable`'s `schema.drillDown` now fails to
compile, and so does a value typed as the shared `DrillDownConfig`. Delete the key: the
pivot always drilled through. Runtime behaviour is unchanged.
