---
'@object-ui/types': minor
---

`DashboardWidgetSchema` chains `@objectstack/spec`'s `checkDashboardWidgetChartMeasureArity` after the metric-family check (objectui#11334, objectui#11417), so `safeValidateSchema` and `objectui validate` now refuse what the spec refuses since 17.7.0. The refusal is one `custom` issue at `values`, with the spec's own message:

- two or more measures with no `dimensions` on a chart type that has no rendering for them without a dimension (`pie`, `donut`, `funnel`, `scatter`, `radar`, `treemap`, `sankey`);
- two or more measures on `pie`, `donut`, `funnel`, `treemap` or `sankey`, even with a dimension. These draw one series and dropped every measure after the first.

This narrows the accepted documents (breaking for a document of either shape). The fix: use `table` or a bar-family type for several measures, or give each measure its own widget. A widget stored before the refusal still renders, and the dashboard's dropped-measure warning still names what it drops. The widget editor's measure picker asks the same door, so it stops offering a second measure on these widgets.
