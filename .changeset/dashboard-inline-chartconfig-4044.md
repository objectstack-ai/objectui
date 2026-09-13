---
'@object-ui/plugin-dashboard': minor
---

dashboard: honour a widget's declared `chartConfig` on the inline chart relays, not only on the dataset path

`DashboardWidget.chartConfig` is declared as the spec's full `ChartConfigSchema` on **every** dashboard widget, but only the ADR-0021 dataset path (`DatasetWidget`) read it. The two inline relays — `DashboardRenderer` and `DashboardGridLayout`, which compose the chart node for a widget bound to inline rows or to a `provider: 'object'` aggregate — mentioned `chartConfig` zero times, so an author who wrote `chartConfig.title` / `.subtitle` / `.description` / `.colors` / `.height` / `.showLegend` / `.showDataLabels` / `.annotations` / `.interaction` on such a widget parsed clean and got nothing on screen.

Both relays now lower those keys through the same `chartConfigPresentation` whitelist `DatasetWidget` uses (`@object-ui/core`), so one authored chart config means the same thing on every dashboard surface.

**Behaviour change, stated explicitly** — this is why the bump is `minor` and not a patch: a dashboard whose stored metadata ALREADY carries `chartConfig` on an inline-bound chart widget renders differently after this change. It draws the authored titles, accessible description, palette, plot height, data labels, annotations and interaction toggles that were previously dropped. Widgets that declare no `chartConfig` compose exactly what they composed before.

Five of the fourteen declared keys are still not forwarded, each for a measured reason. `type` is refused because the widget's own `type` already picks the chart family on this path. `xAxis` / `yAxis` / `series` are refused because whether an authored axis beats the dataset-derived one is an open protocol question, filed for the spec seat as objectstack-ai/objectstack#17385. `aria` is refused because nothing on this path reads it in EITHER spelling — measured by forwarding it anyway, as the nested object and again flattened onto the node's own `ariaLabel` / `ariaDescribedBy` / `role`: neither changed a single attribute on screen, because `ChartRenderer` drops every prop but `schema` and `onChartClick`. Delivering it needs a reader inside `@object-ui/plugin-charts`, which is a separate decision.
