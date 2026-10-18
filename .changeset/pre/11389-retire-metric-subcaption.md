---
'@object-ui/plugin-dashboard': minor
'@object-ui/i18n': minor
'@object-ui/sdui-parser': minor
---

The metric sub-caption is retired on the reader side (objectui#11389, ruling C, the objectui half after `@objectstack/spec` 17.7.0). **BREAKING** for any dashboard that drew a caption under a metric's value.

A metric tile used to draw a sub-caption under its value from the widget's `options.description`, translated by a client bundle entry at `dashboards.NAME.widgets.ID.subCaption`. The spec never declared that options key, and its only writer was the server's `translateDashboard` overlay. `@objectstack/spec` 17.7.0 removed the overlay and refuses a `subCaption` translation entry by name. objectui now stops reading both:

- **`@object-ui/plugin-dashboard`.** No metric tile draws a sub-caption, on either dashboard surface (`DashboardRenderer`, `DashboardGridLayout`), whether the tile is dataset-bound or a stored inline metric. An authored `options.description` (a string or a per-locale map) draws nothing, and neither does a bundle `subCaption` entry. A widget's one authored description, `widget.description`, still draws as the card-header subtitle on `DashboardRenderer`, translated through the widget's `description` bundle key. Nothing on the package entry is removed: the sub-caption resolver module and `DatasetWidget`'s `subCaption` prop were internal.
- **`@object-ui/i18n`.** `useObjectLabel()` no longer returns `widgetSubCaption`. This removes a member of a published hook's return value: a caller that destructured it no longer compiles, and has nothing to call instead, because the key it read is refused by the spec.
- **`@object-ui/sdui-parser`.** `CONSUMED_WIDGET_OPTION_KEYS` drops `'description'` and is now exactly the five keys the spec declares (`dateGranularity`, `limit`, `sortBy`, `sortOrder`, `stageOrder`). So `validateTree` reports an authored `options.description` on a dataset-bound dashboard widget as an `unconsumed-widget-option` **warning**, where it used to report nothing. It is a warning, not an error, and the widget's `suppressWarnings` escape hatch still applies.

**Clause-②: no (narrowing).** One export member is removed (`useObjectLabel().widgetSubCaption`) and one exported constant loses a member (`CONSUMED_WIDGET_OPTION_KEYS`). Nothing is added and no accepted input widens.

If a caption under a metric's value is wanted again, it returns as a declared widget-level key outside `options`, not as `options.description` (ruling C).
