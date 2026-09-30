---
'@object-ui/types': minor
---

`DrillDownConfigSchema` is the zod mirror of `DrillDownConfig`, and both
declarations that carry `drillDown` reference it — `ChartSchema`
(`zod/data-display.zod.ts`) and `ObjectDataTableSchema` (`zod/objectql.zod.ts`)
— so the published validator under `@object-ui/types/zod` reads the key for the
first time (objectui#7352).

`DrillDownConfig` has been declared on the TypeScript face since objectui#6058
seeded the parity ledger, and objectui#6576 declared it on a second type. No zod
mirror existed, so under `BaseSchema`'s `.passthrough()` a
`drillDown: { enabled: 'yes' }` parsed green and rode through to a widget that
reads `enabled` as truthy — `declared !== enforced` on a published surface.

Accept-set change on the published validator, stated plainly:

- NARROWS: a `drillDown` whose declared key holds a value outside its declared
  type (`enabled: 'yes'`, `mode: 'jump'`, `maxRows: '50'`, `report: 'pipeline'`)
  is now refused BY NAME on a `chart` or `object-data-table` node, where it
  previously rode through untouched.
- Unchanged: every value the TypeScript declares still validates, including the
  `{ enabled: true }` / `{ enabled: true, mode: 'record' }` blocks the dashboard
  renderer synthesises, `report`'s two structural forms, and an inline report's
  extra keys (the declaration's index signature is `.catchall(z.unknown())`).
- Output shape, worth knowing before you read a parsed `drillDown.report`: the
  member is a union, and its two arms differ in what they KEEP. The inline arm
  carries the declaration's index signature as `.catchall(z.unknown())`, so extra
  report keys survive; the named-reference arm is a plain object, so a value that
  reaches it keeps only `name` (`{ name: 'x', columns: [] }` is accepted, and
  parses to `{ name: 'x' }`). Both were accepted and unvalidated before, and
  neither is refused now.
- Unchanged: `PivotTableSchema.drillDown` has no zod mirror at all, and
  `DataTableSchema` declares the key on neither face — both are untouched here.
- New export on `@object-ui/types/zod`: `DrillDownConfigSchema`.

`DrillDownConfigSchema` is deliberately NOT `@objectstack/spec/ui`'s
`ChartDrillDownSchema`: that object models the chart-only subset strictly and
refuses `mode` and `report` by name, both of which were, at this change, keys
`DrillDownConfig` declared for the table / pivot / metric widgets that share it.

⚠️ **Dated note, 2026-09-25 — `mode` is read by the table alone — objectui#10685.**
The blocks now take per-block drill shapes. `mode` is read only by
`object-data-table`, on its row click, and is refused by name on `object-pivot`
(`ObjectPivotDrillDownConfig`, objectui#10685) and on `object-metric`
(`ObjectMetricDrillDownConfig`, objectui#9002), whose click points are always
aggregates. `report` is read by `object-pivot` and `object-metric`, through the
drawer they open. The rest of this entry is kept as the reading of this change.

⚠️ **Dated note, 2026-09-28 — `PivotTableSchema` has a mirror now — objectui#10859.**
Later in this same release `PivotTableSchema` gains a zod mirror, and its `drillDown`
is this entry's `DrillDownConfigSchema`, so the opening paragraph's two referencing declarations are three for the release, and the first half of the second "Unchanged" bullet above (`PivotTableSchema.drillDown` has no zod mirror at all) is this change's reading, not the release's. The rest of this entry is kept as
the reading of this change.

⚠️ **Dated note, 2026-09-29 — the `pivot` arm no longer references this mirror —
objectui#10932.** Later in this same release `drillDown` was retired on the `pivot`
node on both faces: `PivotTableSchema.drillDown` is a `?: never` tombstone on the
TypeScript face, and the zod arm declares it as a `retirementTombstone()`, which
refuses the key by name whatever it holds. So "its `drillDown` is this entry's
`DrillDownConfigSchema`, so the opening paragraph's two referencing declarations
are three for the release" in the 2026-09-28 note above no longer holds: for the
release the referencing declarations are the opening paragraph's two, `ChartSchema`
and `ObjectDataTableSchema` (whose member extends this mirror per block,
objectui#10685). The rest of that note stands: `PivotTableSchema` does have a zod
mirror, so "`PivotTableSchema.drillDown` has no zod mirror at all" is still this
change's reading, not the release's, and that mirror's `drillDown` member refuses
the key rather than mirroring it. `.changeset/10932-pivot-drilldown-retired.md`
(PR objectui#10972) states what ships; the text above is kept as the reading of
this change.
