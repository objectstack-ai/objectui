---
'@object-ui/plugin-list': patch
---

`list-view` re-reads its rows when the data-invalidation bus (`notifyDataChanged` from `@object-ui/react`) reports a change to the object it queries (objectui#10572). A write that bypasses the data source — a page action over raw HTTP, a flow, a server action — fires no `onMutation`, so a list on a page used to show it only when the whole page was remounted. The re-read keeps the list mounted; rows a host hands the list inline are still the host's to refresh.
