---
'@object-ui/types': minor
---

feat(types)!: `ObjectChartSchema.xAxisField` / `yAxisFields` / `aggregation` are retired on the `object-chart` node, each refused by name with the spec spelling as its remedy

⚠️ Breaking, marked `minor` under this repo's version-alignment rule (a `major`
in the fixed group would move all of it off the `@objectstack` major). An
`object-chart` node that authors any of the three keys now FAILS to validate,
and a TypeScript literal typed as `ObjectChartSchema` that sets one no longer
compiles.

The three are the LIST-VIEW chart block's vocabulary. The list-view relays
translate that block into `aggregate` / `xAxisKey` / `series` before they
compose an `object-chart` node, and nothing on the node's own render path
reads them: a node written with `xAxisField: 'status'` and
`yAxisFields: ['amount']` over static rows reached the chart with no category
key and no series, and on the inline `objectName` path it drew the
"no category axis" refusal. Yet both published faces declared the keys, so the
node type-checked and parsed green through `objectui validate` — every signal
said the axis was bound.

Each key is now a `?: never` tombstone on the TypeScript face and a
`retirementTombstone()` on the zod mirror (ADR-0049; `BaseSchema` is
`.passthrough()`, so deleting the declarations would have KEPT an authored
value in silence rather than refused it). The refusal is an `invalid_type`
issue at the key's own path whose message names the key and the spelling to
write instead:

- `xAxisField` → `xAxis: { field: 'status' }` (on the inline `objectName`
  path the category is `aggregate.groupBy`);
- `yAxisFields` → `yAxis: [{ field: 'amount' }]`, one entry per value axis
  (on the inline `objectName` path the measure is `aggregate.field`, and a
  dataset-bound chart selects `values` by name);
- `aggregation` → `aggregate: { field, function, groupBy }` with the spec's
  `function` vocabulary (a dataset-bound chart takes its aggregation from the
  dataset's measures).

Not touched: the list-view chart carriers keep these names — they are a
different node and they read them. A one-time producer census, recorded on the
card's pull request and not re-derived here, found no producer writing the
three on an `object-chart` node — in this repository, in the objectstack
showcase, or in hotcrm.

Pinned in `packages/types/src/__tests__/object-chart-legacy-axis-keys-retired-10608.test.ts`.
