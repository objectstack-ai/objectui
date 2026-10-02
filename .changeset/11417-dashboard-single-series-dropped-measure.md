---
'@object-ui/plugin-dashboard': patch
---

fix(plugin-dashboard): a dimensioned `pie` / `donut` / `funnel` / `treemap` / `sankey` widget with several measures now says which measures it drops (objectui#11417)

A dataset-bound chart widget hands every measure it declares to the shared chart
renderer as a series. On the `pie` / `donut`, `funnel`, `treemap` and `sankey` families
the renderer draws the first series and no other, so a widget such as
`{ type: 'pie', dataset, dimensions: ['stage'], values: ['revenue', 'cost'] }` drew
revenue per stage and nothing of cost. The query computed both measures, every door
accepted the document, and nothing said that cost was dropped.

`DatasetWidget`'s dropped-measure warning (objectui#8894) now covers that shape. It names
the widget, the measure it renders and the measures it queried and never displayed, and
says that the chart family draws a single series, the first declared measure. It points
to no ADR-0087 entry for this shape: the metric-family entry the tile warning points to
answers for a one-number tile, and a chart with a dimension is not one. A `pyramid`
widget, which renders as a funnel, is covered too.

**Nothing is drawn differently.** The chart still receives every measure and draws what
it drew before. A single measure on these charts stays silent, and so does every chart
that draws each measure (`bar`, `line`, `area`, `combo`, `radar`, and so on). A `scatter`
with several measures is unchanged: the chart already shows a notice naming the series
it cannot plot.

The spec is to refuse two or more measures on these five types with a dimension
(objectstack#21293); until objectui's pin carries that refusal, every door accepts the
shape and this warning is the signal.
