---
'@object-ui/types': minor
'@object-ui/plugin-dashboard': patch
---

`object-data-table` refuses `drillDown.filter`, `.maxRows`, `.report` and `target: 'navigate'`, and `object-pivot` refuses `drillDown.mode` (objectui#10685)

**Breaking for authored metadata, graded `minor` by this repo's convention (AGENTS.md: a
breaking change here is `minor`, never `major`):** `object-data-table` no longer accepts
`drillDown.filter`, `drillDown.maxRows`, `drillDown.report` or `drillDown.target: 'navigate'`
on either published face — the TypeScript `ObjectDataTableSchema.drillDown` and its zod
mirror, the door `objectui validate` / `safeValidateSchema` run — so a stored JSON table
config that parsed green before is refused by name now. Each refusal names the key and the
blocks that do read it. None of the four was ever read by this block. Migration: delete the
key; for the drill target write `'drawer'` or `'dialog'`. `enabled`, `mode`, `title` and
`columns` are accepted exactly as before.

Its row drills to the one record it already is, so a drilled list's filter, row cap and
report had nothing to act on, and `'navigate'` was drawn as a drawer. Before this change the
table's zod mirror took the shared `DrillDownConfigSchema` and accepted all four.

`object-pivot` is refused at the TypeScript door only. A stored JSON pivot config carrying
`mode` is still accepted and ignored at render, as it was before: neither `object-pivot` nor
`PivotTableSchema` has a zod mirror, so no validator in this repository reads the members of
a pivot's `drillDown`. `mode` never had a read site on a pivot. Every pivot click point is an
aggregated bucket (a cell, a row or column header, or a total), so the block always drills
through, and `mode`, which chooses drill-to-record for a clicked row, had nothing to choose.

- `@object-ui/types` adds two per-block shapes beside `ObjectMetricDrillDownConfig`, both
  published on the root entry `@object-ui/types` and on the `@object-ui/types/data-display`
  subpath. Each tombstone's docblock names the blocks that do read the key.
  - `ObjectDataTableDrillDownConfig`: `DrillDownConfig` with `filter?: never`,
    `maxRows?: never` and `report?: never`, and `target?: 'drawer' | 'dialog'`.
    `ObjectDataTableSchema.drillDown` is typed with it, and the `drillDown` member of its zod
    mirror (`@object-ui/types/zod`) refuses the same members by name.
  - `ObjectPivotDrillDownConfig`: `DrillDownConfig` with `mode?: never`.
- The shared `DrillDownConfig` keeps every member for the blocks that read them. Its `mode`
  docblock now names only `object-data-table` instead of charts, pivot tables and metric
  cards, none of which read it.
- `@object-ui/plugin-dashboard` types `ObjectPivotTable`'s `schema.drillDown` with
  `ObjectPivotDrillDownConfig`, and the component reads its drill config through that type
  instead of through `any`. `ObjectDataTable`'s prop is `ObjectDataTableSchema`, so it takes
  the table's shape with it.

TSX code now fails to compile in two places. The first is a refused member inside
`ObjectDataTableSchema.drillDown`, or inside `ObjectPivotTable`'s `schema.drillDown`. The
second is a value typed as the shared `DrillDownConfig` handed to either. Delete the key.
Runtime rendering is unchanged.

⚠️ **Dated note, 2026-09-28 — the plain `pivot` node has a mirror now — objectui#10859.**
Later in this same release `PivotTableSchema` (the `pivot` node, not `object-pivot`) gains a
zod mirror whose `drillDown` is the shared `DrillDownConfigSchema`, so a validator does read
the members of a `pivot` node's `drillDown`, and accepts `mode` there, as `DrillDownConfig`
declares it. `object-pivot` still has no mirror, so what the paragraph above says of a stored
`object-pivot` config stands. The rest of this entry is kept as the reading of this change.

⚠️ **Dated note, 2026-09-29 — the `pivot` node refuses `drillDown` whole now — objectui#10932.**
Later in this same release `drillDown` was retired on the `pivot` node on both faces:
`PivotTableSchema.drillDown` is a `?: never` tombstone, and the `pivot` arm of the zod mirror
declares it as a `retirementTombstone()`, which refuses the key by name whatever it holds
(`invalid_type` at `drillDown`). So "a validator does read the members of a `pivot` node's
`drillDown`, and accepts `mode` there" in the 2026-09-28 note above no longer holds: the
validator refuses the whole key before reading any member, so it accepts no `mode` on a `pivot`
node. Nothing ever drilled a `pivot` node; a pivot drill is authored on `object-pivot`, whose
`drillDown` type, `ObjectPivotDrillDownConfig`, refuses `mode` at the TypeScript door, as this
entry says. `object-pivot` still has no zod mirror, so what this entry says of a stored
`object-pivot` config stands. `.changeset/10932-pivot-drilldown-retired.md` (PR objectui#10972)
states what ships; the text above is kept as the reading of this change.
