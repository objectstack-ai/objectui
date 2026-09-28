---
'@object-ui/plugin-view': patch
---

fix(plugin-view): an `object-view` in a non-grid view re-reads its rows on the data-invalidation bus

For the non-grid views (kanban, calendar, gallery, timeline, map, gantt),
`ObjectView` fetches the rows itself and hands them to the inner view as
`data`, which switches off that view's own bus reader. That fetch
now names the `useDataInvalidation` nonce for `schema.objectName`, so a write
declared on the bus (`notifyDataChanged`, as a page action over raw HTTP does),
or an unscoped `'*'`, re-reads the rows in place: the inner view is not
remounted. A change to another object does not re-read. Before, such a write
reached these views only when their host remounted them, and `PageView` is
about to stop doing that (objectui#10519).

The subscription follows the rows the view draws: a host `renderListView` (its
`ListView` reads the bus itself) and the grid (`ObjectGrid` does too) do not
subscribe here, and neither does a view with no object or no data source. Nor
do the host-only `tree` and `chart` views: their renderers query for themselves
and read the bus themselves, so a re-read here would only add reads beside
theirs.

**Clause-②: no** — no exported symbol, prop or authored key is added, removed,
renamed or retyped, and no accept set moves. What changes is when an existing
read runs.
