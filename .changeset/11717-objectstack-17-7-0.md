---
'@object-ui/types': patch
'@object-ui/plugin-dashboard': patch
---

objectui now resolves `@objectstack/*` 17.7.0 (objectui#11717). Two declared `@objectstack/spec` floors move, each because the package's published code now imports something an older release does not export:

- `@object-ui/types`: `^17.6.0` to `^17.7.0`. Its zod mirrors chain `checkDashboardWidgetChartMeasureArity` and `checkPageRequiresKind`, which the spec first exports in 17.7.0.
- `@object-ui/plugin-dashboard`: `^17.5.0` to `^17.6.0`. `DatasetWidget` reads `DASHBOARD_WIDGET_MULTI_MEASURE_TYPES`, which the spec first exports in 17.6.0, instead of restating it. What the widget draws does not change.

No other declared range moves.
