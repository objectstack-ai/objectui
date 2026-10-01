---
'@object-ui/types': minor
---

**BREAKING (authoring, TypeScript only):** on a dashboard widget, `chartConfig.type`, `chartConfig.xAxis`, `chartConfig.yAxis` and `chartConfig.series` are now compile errors, the same verdict the validator already gives (objectui#11315).

`@objectstack/spec` 17.5.0 gave the dashboard widget its own chart config carrier,
`DashboardWidgetChartConfigSchema`, which refuses these four structure keys (ADR-0021 · ADR-0049 D2).
A dashboard widget is bound to a dataset, and the dataset owns the chart's structure: the family is
the widget's own `type`, the category axis is `dimensions`, and the measures and series are `values`.
`chartConfig` keeps the appearance keys (`title`, `subtitle`, `description`, `colors`, `height`,
`showLegend`, `showDataLabels`, `annotations`, `interaction`).

- **Zod mirror: no change.** `DashboardWidgetSchema` takes the spec's `chartConfig` by reference, so
  it has refused the four since this package began resolving 17.5.0, with the spec's own message at
  `chartConfig.<key>`. A new pin records this on the dashboard node, `safeValidateSchema` and the
  strict authoring face.
- **TypeScript: changed.** `DashboardWidgetSchema.chartConfig` typed these keys `any`, so they
  compiled. Each now comes from the spec's own member and admits no value, as `aria` already did.
  Every other `chartConfig` key keeps its previous typing.

What to do: delete the keys and move the intent onto the widget.

```ts
// before: compiled, was refused at validation
const widget: DashboardWidgetSchema = {
  type: 'bar',
  dataset: 'tasks',
  values: ['task_count', 'avg_progress'],
  chartConfig: { type: 'combo', xAxis: { field: 'assignee' }, series: [{ name: 'avg_progress', type: 'line' }] },
};
// after: the family on the widget, the axis and the series in the dataset selection
const widget: DashboardWidgetSchema = {
  type: 'combo',
  dataset: 'tasks',
  dimensions: ['assignee'],
  values: ['task_count', 'avg_progress'],
};
```

A per-series mark or a second value axis has no home on a dashboard widget. If you need one, draw
the chart as an `object-chart` node with inline `data`: that tier keeps `series`, `xAxis` and
`yAxis` authorable.

This is released as `minor`, following this repository's version policy: breaking semantics are
marked `minor` and described here.
