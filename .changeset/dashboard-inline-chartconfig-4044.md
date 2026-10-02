---
'@object-ui/plugin-dashboard': minor
---

dashboard: honour a widget's declared `chartConfig` on the inline chart relays, not only on the dataset path

`DashboardWidget.chartConfig` is declared on **every** dashboard widget, but only the ADR-0021 dataset path (`DatasetWidget`) read it. The two inline relays — `DashboardRenderer` and `DashboardGridLayout`, which compose the chart node for a widget bound to inline rows or to a `provider: 'object'` aggregate — mentioned `chartConfig` zero times, so an author who wrote `chartConfig.title` / `.subtitle` / `.description` / `.colors` / `.height` / `.showLegend` / `.showDataLabels` / `.annotations` / `.interaction` on such a widget parsed clean and got nothing on screen.

Both relays now lower those keys through the same `chartConfigPresentation` whitelist `DatasetWidget` uses (`@object-ui/core`), so one authored chart config means the same thing on every dashboard surface.

**Behaviour change, stated explicitly** — this is why the bump is `minor` and not a patch: a dashboard whose stored metadata ALREADY carries `chartConfig` on an inline-bound chart widget renders differently after this change. It draws the authored titles, accessible description, palette, plot height, data labels, annotations and interaction toggles that were previously dropped. Widgets that declare no `chartConfig` compose exactly what they composed before.

Five of the fourteen keys of the spec's `ChartConfigSchema` are not forwarded, and `@objectstack/spec` 17.5.0 refuses all five on a dashboard widget's chart config at parse. `type` is refused because the widget's own `type` already picks the chart family on this path. `xAxis` / `yAxis` / `series` are refused because the widget's derived bindings own the chart's structure: the spec's `DashboardWidgetChartConfigSchema` refuses all three (ADR-0021 · ADR-0049 D2), which answered the precedence question objectstack-ai/objectstack#17385 raised. `aria` is refused because nothing on this path reads it in EITHER spelling — measured by forwarding it anyway, as the nested object and again flattened onto the node's own `ariaLabel` / `ariaDescribedBy` / `role`: neither changed a single attribute on screen, because `ChartRenderer` drops every prop but `schema` and `onChartClick`. Rather than give it a reader, the spec retired the key (objectstack-ai/objectstack#17751).
