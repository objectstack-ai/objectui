---
'@object-ui/plugin-dashboard': minor
---

**BREAKING (rendering):** a dataset-bound dashboard widget no longer reads `chartConfig.series`, `chartConfig.xAxis` or `chartConfig.yAxis` (objectui#11315).

`@objectstack/spec` 17.5.0 refuses these keys on a dashboard widget's chart config
(`DashboardWidgetChartConfigSchema`, ADR-0021 · ADR-0049 D2), together with `chartConfig.type`, which
the widget never read. Until now the dataset widget still merged their presentation half onto the
dataset-derived chart: a per-series mark and axis side from `series[]`, and axis titles, number
formats, min/max and a second value axis from `xAxis` / `yAxis`.

- A widget that still carries the keys (stored metadata that was never re-validated) now renders
  the dataset's own derivation: one series per measure in `values`, the category axis from
  `dimensions`, and no authored axis.
- A `combo` widget still draws as a combo, but each series takes the chart renderer's own mark
  rather than an authored `series[].type`. A `bar` / `line` / `area` widget that declared one series
  as a different mark draws as its own family.
- A comparison overlay (`compareTo`) no longer copies its measure's authored mark or axis; there is
  none to copy.
- The chart chrome in `chartConfig` (`title`, `subtitle`, `description`, `colors`, `height`,
  `showLegend`, `showDataLabels`, `annotations`, `interaction`) is lowered exactly as before.

What to do: run `os validate` (or the spec's `os migrate meta --from 17`) on dashboards that author
these keys, delete them, and select `dimensions` / `values` on the widget. A chart that needs
per-series marks or a second value axis belongs on an `object-chart` node with inline `data`, where
the spec keeps `series`, `xAxis` and `yAxis` authorable.

This is released as `minor`, following this repository's version policy: breaking semantics are
marked `minor` and described here.
