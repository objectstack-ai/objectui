---
'@object-ui/core': minor
---

BREAKING (`@object-ui/core`): `mergeAuthoredPresentation` and `axisPresentation` are no longer exported (objectui#11372).

(The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

Both lowered an authored chart config's `xAxis` / `yAxis` (spec `ChartAxis` objects) onto the chart schema a dataset-bound surface builds. Their one caller was the dashboard's dataset widget, which stopped reading `chartConfig.xAxis` / `yAxis` / `series` when `@objectstack/spec` 17.5.0 refused them on a dashboard widget (objectui#11315). Nothing else in this repository called them, and a published export with no consumer is not kept, so both are removed.

What stays, unchanged: `mergeAuthoredSeries` (the series-presentation merge the report renderer calls), `seriesPresentation`, `chartConfigPresentation` and `chartTypeIgnoresCompareTo`. The react `ObjectChart` tier never used the removed pair: it hands its own `xAxis` / `yAxis` to `ChartRenderer`, whose `normalizeChartSchema` (`@object-ui/plugin-charts`) reads them off the chart schema directly.

Migration: none inside this repository. An out-of-repo caller of either function stops compiling, and there is no replacement export, because no surface left lowers authored axis presentation. The effect on out-of-repo callers was not measured.
