---
'@object-ui/plugin-dashboard': patch
---

Fix: the editable dashboard grid (`dashboard-grid`, `DashboardGridLayout`) now
treats widgets whose data is `{ provider: 'object', object }` the way the
read-only `DashboardRenderer` already does (objectui#10528). Before this change
the grid turned a table, list or pivot widget with that config into a static
node with `data: []`. The tile showed an empty table or cross-tab and sent no
query.

**Table and list widgets now fetch their rows.** The grid builds the same node
`DashboardRenderer` builds for the widget: an `object-data-table`, which loads
the object's rows through the data source. The props match too:

- the provider's `filter` (or the widget's `filter`) reaches the query;
- the widget's `searchable` and `pagination` are honoured, and a `list` never
  gets them;
- a row click opens the record in a drawer by default, as on the read-only
  dashboard. `options.drillDown` still overrides this. In edit mode, dragging
  still starts only from the drag handle.

**Pivot widgets with that config now show the retired-widget placeholder.**
It is the same placeholder `DashboardRenderer` already shows for them ("This
widget uses a retired data format. Edit it to bind a dataset."). Under ADR-0021
a pivot is bound to a dataset, and a dataset-bound pivot still renders as
before.

Widgets bound to inline rows are unchanged, including static-data pivots.
