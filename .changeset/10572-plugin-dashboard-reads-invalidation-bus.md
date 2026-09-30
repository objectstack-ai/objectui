---
'@object-ui/plugin-dashboard': patch
---

`object-metric` (`ObjectMetricWidget`) re-reads its value when the data-invalidation bus (`notifyDataChanged` from `@object-ui/react`) reports a change to the object it aggregates (objectui#10572). A write that bypasses the data source — a page action over raw HTTP, a flow, a server action — used to leave the tile stale until the whole page was remounted.
