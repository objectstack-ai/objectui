---
'@object-ui/plugin-charts': patch
---

An object-bound `object-chart` that names its category with `aggregate.groupBy` alone now draws that
category, instead of being refused with `missing-category-key` (objectui#10634).

A node with `objectName`, `aggregate: { field: 'amount', function: 'sum', groupBy: 'stage' }` and
`series`, and no `xAxisKey` or `xAxis`, passed `ObjectChart`'s absent-category screen (objectui#8168),
whose remedy lists `aggregate.groupBy` first. The schema `ObjectChart` then handed to `ChartRenderer`
carried no category key, so the chart floored it on `'name'`, found no `name` column in the grouped
rows, and refused. The author had followed the refusal's own remedy and was refused again, over a key
they never wrote.

`ObjectChart` now forwards the category when the author named it only through `groupBy`. The key it
forwards is the column the aggregate projects its group under, per the contract's result-column
convention (`chartAggregateResultKeys` in `@objectstack/spec/ui`): the `groupBy` string, or
`alias ?? field` for the structured `{ field, dateGranularity?, alias? }` node. This is the same
column the dashboard relays already bind (objectui#8269). An `alias` therefore binds the aliased
column the rows carry, not the underlying field.

What does not change:

- An authored category axis always wins. The forward fills an absent slot only, and asks this
  package's own axis resolution whether one is authored: `xAxisKey`, a spec-shape `xAxis: { field }`,
  or a bare string `xAxis`. It never writes over any of them.
- Charts that draw authored rows (`data`, or a `bind` scope) are unchanged, with or without
  `objectName`. Their rows never went through the aggregate, so `groupBy` says nothing about their
  columns.
- Dataset-bound charts (ADR-0021) are unchanged. They take their category from their dimensions.
- The absent-category refusal fires on exactly the same nodes as before.
