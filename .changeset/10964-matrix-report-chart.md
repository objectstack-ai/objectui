---
'@object-ui/plugin-report': patch
---

A `matrix` report that declares `columns` now draws its declared `chart` below the cross-tab
(objectui#10964). `ReportSchema` has always accepted a matrix report carrying both `columns` and
a `chart`, but the renderer's cross-tab branch returned before the chart was read, so the chart
parsed and was never drawn. It binds the way the summary report's chart does: `chart.xAxis` names
a dataset dimension (a `rows` or a `columns` dimension of the matrix) and `chart.yAxis` a dataset
measure, plotted from the chart's own dataset query. Summary, tabular and matrix-without-`columns`
reports keep the chart above their table, as before.

The notice an out-of-spec chart type shows no longer says the table is "below" it, since on a
matrix report the table sits above the notice.
