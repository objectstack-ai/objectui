---
"@object-ui/plugin-charts": minor
"@object-ui/plugin-dashboard": patch
"@object-ui/core": minor
"@object-ui/types": minor
---

**Clause-②: yes (an export widens, and an accept set narrows)**

A chart's value axis over a count now draws whole-number ticks (objectui#11681). Dashboard charts over a `count` measure ("Tasks by Status", "Projects by Health", "Invoices by Month") used to read 0.5, 0.8, 1.5 or 2.3 on their value axis. The dataset answer states each measure column's aggregate (`fields[].aggregate`, from `@objectstack/spec` 18). The chart now carries it to the axis, and an axis whose series all plot `count` or `count_distinct` sets `allowDecimals: false`. Any other measure on the axis keeps the previous ticks, so a sum over currency keeps its decimals. Every cartesian value axis is covered, including the horizontal-bar value axis that runs across the plot. Each side of a dual-axis chart decides for itself.

- `@object-ui/core` (widens): `buildChartSeries` copies a result field's `aggregate` onto the series it derives. `ChartResultField` and `ChartSeriesBinding` gain an optional `aggregate`. `INTEGER_AGGREGATES` and `isIntegerAggregate` are new exports.
- `@object-ui/plugin-dashboard`: the dataset widget keeps the aggregate on the series it builds. That includes the comparison overlay and the series a dimensionless chart transposes, which states an aggregate only when every measure shares it.
- `@object-ui/plugin-charts` (widens): the `dataKey` arm of `ChartRendererProps.schema.series` and `NormalizedSeries` (carried by the exported `NormalizedChartSchema`) gain an optional `aggregate`, read by `normalizeSeries`. The accept set only widens: nothing that compiled before is refused. The member is renderer-internal.
- `@object-ui/types` (narrows): `aggregate` on a chart series is refused by name. FROM: `ChartDataSeriesSchema` (and so `ChartSchema.series[]`) accepted `{ name, aggregate: 'count' }` and stripped the key. TO: it refuses that series with an `invalid_type` issue at `aggregate`, and `ChartDataSeries.aggregate` is typed `?: never`. The key is internal: declare the aggregate on the dataset measure instead.
