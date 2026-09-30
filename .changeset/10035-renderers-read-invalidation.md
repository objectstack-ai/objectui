---
'@object-ui/plugin-grid': patch
'@object-ui/plugin-gantt': patch
'@object-ui/plugin-charts': patch
'@object-ui/plugin-view': patch
'@object-ui/app-shell': patch
---

Gantt, chart and grid views refresh in place after a write instead of being rebuilt (objectui#10035).

`ObjectGrid`, `ObjectGantt` and `ObjectChart` query for themselves and read no refresh input, so both object-view layers could show them a write only by remounting them — which lost a gantt's scroll, collapsed groups and zoom, a chart's open drill-down, and a grid's selection, column state and in-progress edit. Each now refetches when the data-invalidation bus (`notifyDataChanged` / `useDataInvalidation` from `@object-ui/react`) reports a change to the object it reads:

- `@object-ui/plugin-grid`: `ObjectGrid` re-reads its rows into the same table.
- `@object-ui/plugin-gantt`: `ObjectGantt` re-reads silently and keeps the chart mounted, as its toolbar refresh does.
- `@object-ui/plugin-charts`: `ObjectChart` re-runs its query on both binding shapes — an object-bound aggregate follows its `objectName`, a dataset-bound chart follows the dataset's base object as the `queryDataset` answer names it.
- `@object-ui/plugin-view`: the object view keys every view on its identity alone, and declares on the bus its own saves and deletes and each `onMutation` write it hears.
- `@object-ui/app-shell`: the object page keys its list and its chart view on identity alone, and declares on the bus the changes it learns of without a data-source write — server actions, flows, imports, realtime events and an explicit refresh.

Rows a host hands these components (`data`, `bind`, inline values) are still the host's to refresh; only the components' own queries follow the bus.
