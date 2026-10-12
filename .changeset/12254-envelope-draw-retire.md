---
'@object-ui/plugin-dashboard': minor
---

Both dashboard surfaces draw a widget's legacy `component` envelope the way it is authored: a `metric-card` node draws as before, and any other node draws the retired-format prompt (objectui#12254, the follow-on ruling C on objectui#12163 named).

BREAKING (`@object-ui/plugin-dashboard`): a stored widget whose `component` holds any node other than a `metric-card` (a `custom` widget's `text`, `statistic`, `object-chart`, `object-data-table`, `card`, a node with no `type`, or a primitive) no longer draws that node. `DashboardRenderer` and `DashboardGridLayout` draw "This widget uses a retired data format. Edit it to bind a dataset." in its tile instead, and the node sends no query. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

- FROM `{ "id": "w", "type": "custom", "component": { "type": "object-chart", "objectName": "invoice", "chartType": "bar" } }` drawing the chart, the dashboard filter bar scoping its query.
- TO the same stored widget drawing the retired-format prompt. Write it in the spec form, bound to a dataset (ADR-0021): `{ "id": "w", "type": "bar", "dataset": "invoices", "dimensions": ["region"], "values": ["amount"] }`, or put a `metric-card` in the slot: `{ "id": "w", "component": { "type": "metric-card", "title": "Revenue", "value": "$1.2M" } }`.

Why: since objectui#12163 both zod faces and `DashboardWidgetSchema['component']` take a `metric-card` only in this slot and refuse every other node by name, while the surfaces still drew whatever a stored envelope held. `@objectstack/spec` declares neither the envelope nor a `custom` widget, and its strict `DashboardWidget` refuses a `component` key outright. A read-only census of stored use found no producer of a non-`metric-card` envelope node outside tests and docs (the count is on objectui#12254), so the draw now matches the authoring rule. The accept set is read from the same closed list, `DASHBOARD_COMPONENT_WIDGET_TYPES`, through one predicate both surfaces share, `isRetiredEnvelopeNode`. The `object-metric` node objectui#11466 retired in this slot is one case of it.

Also changed with it:

- A `custom` widget with no `component` drew a prompt to "set `component` to a UIComponent schema" on `DashboardRenderer`, which this change made false. It now draws the labelled placeholder `DashboardGridLayout` already drew for it, "「custom」chart type is not supported yet".
- The dashboard filter bar no longer scopes an `object-chart` or `object-data-table` placed in the envelope, since neither draws there.

Unchanged: a `metric-card` in the envelope or directly in `widgets[]`, a widget with no `component`, and the retired-format prompt's wording. No placeholder, prop, export or i18n key is added.
