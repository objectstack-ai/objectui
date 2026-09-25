---
'@object-ui/plugin-dashboard': patch
---

Fix: on the editable dashboard grid (`dashboard-grid`, `DashboardGridLayout`), a
table or list widget whose data is `{ provider: 'object', object }` now fetches
its rows and draws them (objectui#10528).

Before this change the grid turned that widget into a static `data-table` node
with `data: []`. That node never reads `objectName`, so the tile showed an empty
table and sent no query. The read-only `DashboardRenderer` drew the same stored
widget correctly.

The grid now builds the same node `DashboardRenderer` builds for that widget: an
`object-data-table`, which loads the object's rows through the data source. The
props match too:

- the provider's `filter` (or the widget's `filter`) reaches the query;
- the widget's `searchable` and `pagination` are honoured, and a `list` never
  gets them;
- a row click opens the record in a drawer by default, as on the read-only
  dashboard. `options.drillDown` still overrides this. In edit mode, dragging
  still starts only from the drag handle.

Tables bound to inline rows are unchanged. A `pivot` widget with a
`provider: 'object'` config is also unchanged in this release.
