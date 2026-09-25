---
'@object-ui/plugin-gantt': minor
'@object-ui/i18n': patch
---

`ObjectGantt` refreshes in place when its query really changes, instead of tearing the chart down to the loading placeholder (objectui#7237).

Once the chart has painted, a change to its sort, filter, permissions, search or bound source re-runs the query with the chart still mounted, so it keeps its scroll position, its collapsed groups and any inline edit in progress. While the query runs, a thin indeterminate bar over the chart marks the rows on screen as the previous answer, and the rows are replaced when the new answer lands. It is the same `RefreshIndicator` that `ObjectGrid`, `ListView` and `ObjectChart` draw over their rows. The initial load still shows the loading placeholder.

The bar also shows during the chart's other in-place re-reads: the toolbar refresh, the re-read after a drag, a dependency link, a delete or a field edit, and a re-read triggered by the data-invalidation bus. Those already kept the chart mounted, but the only sign of them was a disabled refresh button.

A changed query that fails is still reported as an error, as it was before. Only a re-read of the same query keeps its last good rows when it fails.

`@object-ui/i18n`: new key `gantt.aria.refreshing`, the bar's accessible name, in all ten locale packs.
