---
'@object-ui/react': minor
---

`useNavigationOverlay` hands an authored `page` click with no `onNavigate` to the record navigator the host publishes (objectui#11293).

`page` is the spec's default navigation `mode`, so `navigation: { mode: 'page' }` and every block written without `mode` (for example `{ size: 'lg' }`) resolve to it. The hook's `page` branch called `onNavigate` and nothing else, so a block a host rendered without wiring one — a standalone `object-kanban`, `object-calendar` or `object-grid` placed on a page — opened nothing on click. With no `onNavigate` supplied, the branch now calls `openRecord(objectName, recordId)` from `RelatedRecordActionsContext`, the seam the grid's link column and the lookup cells already read; the hook still builds no record URL for `page`.

What does not change: an `onRowClick` still takes the click first, a supplied `onNavigate` still wins (the grid's explicit wiring and the console's list views behave as before), an absent `navigation` stays the host's call, and modifier clicks and `new_window` are untouched. Under a host that publishes no record navigator the click still opens nothing, because there is no record page to open.
