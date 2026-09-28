---
'@object-ui/types': minor
'@object-ui/plugin-dashboard': minor
---

`drillDown` is retired on the bare `pivot` node: author `object-pivot` to drill (objectui#10932)

**Breaking for authored metadata, graded `minor` by this repo's convention (AGENTS.md: a
breaking change here is `minor`, never `major`):** a `pivot` node no longer accepts
`drillDown` on either published face. The TypeScript `PivotTableSchema.drillDown` is a
`?: never` tombstone, and the `pivot` arm of the zod mirror, the door `objectui validate` /
`safeValidateSchema` run, refuses the key by name with `invalid_type` at `drillDown`. The
refusal names the remedy. Migration: delete the key, or, for a pivot whose cells open the
records behind a value, author an `object-pivot` (`objectName` plus the same `rowField` /
`columnField` / `valueField`) and put the `drillDown` there. Every other `pivot` member is
accepted exactly as before.

Nothing ever honoured the key on this node. `PivotTable` fired a drill only when its host
passed an `onDrillDown` handler. The one host that does is `ObjectPivotTable`, which renders
`object-pivot`, and the `pivot` registration passes none. So an authored `drillDown`
validated and clicking a cell did nothing, with no signal. A pivot over inline `data` also
names no object to list the drilled records from. No shipped or example document authors
the key on a `pivot` node.

This supersedes what three pending entries say about the `pivot` arm's `drillDown`: the
objectui#10859 (batch 2) entry ("`drillDown` is the shared `DrillDownConfigSchema`"), and the
dated notes on the objectui#7352 and objectui#10685 entries, which read that key as the shared
mirror (a third referencing declaration, and `mode` accepted there). As of this change the
arm refuses the key.

- `@object-ui/types`: `PivotTableSchema.drillDown` is `?: never`, and the zod `pivot` arm's
  `drillDown` is a `retirementTombstone()`. The content-channel refusal on `body` / `children`
  no longer lists `drillDown` among what a `pivot` renders.
- `@object-ui/plugin-dashboard`: `PivotTable` reads nothing off `schema` for its drill.
  **Behaviour change for React callers:** its `onDrillDown` prop is now the only switch. A
  caller that passes a handler gets interactive cells, headers and totals, and a
  `schema.drillDown` no longer gates them (the type refuses that key anyway). A caller that
  wants no drill passes no handler. `ObjectPivotTable` already passed its handler only when
  its own `drillDown` was enabled, so `object-pivot` behaves exactly as before, and its
  `schema.drillDown` keeps the `ObjectPivotDrillDownConfig` type.
