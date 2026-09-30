---
'@object-ui/plugin-calendar': patch
---

`object-calendar` re-reads its events when the data-invalidation bus (`notifyDataChanged` from `@object-ui/react`) reports a change to the object it queries (objectui#10572). A write that bypasses the data source — a page action over raw HTTP, a flow, a server action — fires no `onMutation`, so a calendar on a page used to show it only when the whole page was remounted. Inline and external events are still the host's to refresh.
