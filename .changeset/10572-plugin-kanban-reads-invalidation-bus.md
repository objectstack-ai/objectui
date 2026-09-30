---
'@object-ui/plugin-kanban': patch
---

`object-kanban` re-reads its cards when the data-invalidation bus (`notifyDataChanged` from `@object-ui/react`) reports a change to the object it queries (objectui#10572). A write that bypasses the data source — a page action over raw HTTP, a flow, a server action — fires no `onMutation`, so a board on a page used to show it only when the whole page was remounted. External, bound and inline cards are still the host's to refresh.
