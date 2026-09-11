---
"@object-ui/core": minor
"@object-ui/plugin-charts": minor
"@object-ui/plugin-dashboard": minor
---

fix(plugin-dashboard,core,plugin-charts): route a structured `aggregate.groupBy` on `object-metric` to the spec-shape wire

An authored `aggregate.groupBy` is a union — a bare field name, or the
structured date-bucketing node `{ field, dateGranularity?, alias? }` — and the
two need different queries. The spec-shape
`{ groupBy: GroupByNode[], aggregations, where }` reaches `engine.aggregate` and
runs the server-side date-bucket engine; the legacy
`{ field, function, groupBy, filter }` query reaches the cube/analytics wire,
whose `dimensions` the contract declares as an array of dimension NAMES and
which does not honour `dateGranularity` at all.

`ObjectChart.runAggregate` has routed between the two since objectui#7946.
`ObjectMetricWidget.computeOne` had no such branch: it forwarded the authored
value straight through, so a metric widget carrying a structured node posted
`dimensions: [{ field: 'closed_at', dateGranularity: 'month' }]` — an object
where a name is declared. Nothing refused it and nothing reported it, so the
author asked for one question and the platform answered another (objectui#8613).

- The routing test and the payload are now one function,
  `objectAggregateSpecQuery` (with `isStructuredGroupBy`) in `@object-ui/core`.
  `ObjectChart.runAggregate` and `ObjectMetricWidget.computeOne` both call it,
  so the two renderers cannot post different wires for one authored shape. The
  measure alias is `chartMeasureKey`'s answer, i.e. what the chart's own
  `aggregateValueKey` already delegated to — the chart's posted payload is
  unchanged.
- `ObjectMetricWidgetProps.aggregate.groupBy` said `string`. That was a claim
  about the author which nothing upstream backed: the value crosses two `any`
  seams on the way in, so the declaration refused the node at neither compile
  time nor runtime. It is now the contract's union, taken by reference through
  `ObjectChartSchema['aggregate']`.

Unchanged, and pinned as controls: a plain string `groupBy` and an absent one
(floored at the single `'_all'` bucket) still take the legacy query byte for
byte, and an ARRAY `groupBy` still travels there too — it is not this union's
object arm, and it must keep reaching the producer-side refusal objectui#6864
landed in the adapter.
