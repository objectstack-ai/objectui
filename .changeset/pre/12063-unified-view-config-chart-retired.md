---
'@object-ui/types': minor
---

feat(types)!: `UnifiedViewConfig.chart` retires with a tombstone that names the spec's list chart block, and the three `object-chart` legacy-axis refusals stop calling those keys a list-view spelling (objectui#12063)

Clause-②: no

**Retired (breaking), `@object-ui/types`.** `UnifiedViewConfig.chart` declared the list-view chart's
pre-ADR-0021 inline query: `chartType` beside `xAxisField`, `yAxisFields`, `aggregation`, `series`,
`config` and `filter`. No route reads those axes since objectui#6152 round 15, and every list-view door
refuses them by name. The member is now `chart?: never`, so a value typed `UnifiedViewConfig` that
writes `chart` stops compiling on upgrade, at any value. A plain deletion would not have refused it:
the interface keeps its `[key: string]: any` index signature, which would admit `chart` as `any`.

| before | after | write instead |
| :--- | :--- | :--- |
| `chart: { chartType, xAxisField, yAxisFields, aggregation, series, config, filter }` on a `UnifiedViewConfig` | a compile error at `chart` | the spec's list chart block, `ListChartConfig` from `@objectstack/spec/ui` (the `chart` member of its `ListView`): `{ chartType, dataset, dimensions, values }`, bound to an ADR-0021 dataset by name |

**Not measured: consumers outside the checkouts a seat can reach.** A census before this change found
nothing that imports `UnifiedViewConfig` in this repository (packages, apps, tests, docs, examples,
skills), in the ObjectStack framework checkout or in the installed dependency tree, each with a
positive control. It is a one-time reading, recorded on the pull request, and nothing re-derives it.
Host applications built on the published package were not measured.

**Changed, `@object-ui/types`.** The `object-chart` node's refusals of `xAxisField`, `yAxisFields` and
`aggregation`, and the docblocks of the same three `ObjectChartSchema` members in the published
`.d.ts`, no longer call each key "the list-view chart block's spelling": no list-view route reads that
spelling, and the list view's chart block refuses it. Each refusal and each docblock still names its
key and the same remedy: `xAxis: { field }`, `yAxis: [{ field }]` and
`aggregate: { field, function, groupBy }`.
