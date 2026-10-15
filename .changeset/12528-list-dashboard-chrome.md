---
'@object-ui/plugin-view': minor
'@object-ui/plugin-grid': minor
'@object-ui/plugin-list': patch
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

The object list's chrome sits on fewer rows (objectui#12528).

- **The view description no longer takes a row above the toolbar**, so the toolbar sits at one height with or without one. The console's view tab strip draws it on the active tab: as the tab's tooltip and as the header of its ▾ menu. `ViewTabItem` gains an optional `description` (already resolved, already gated on `appearance.showDescription`; `false` still shows it nowhere). A `ListView` with no host tab strip (the console below `sm`, any other host) draws it as an info control at the start of its toolbar row.
- **The sort popover's standing note about linked columns is an info control** beside the popover's title, the note as its tooltip, instead of a paragraph that took about half the popover on every open. One line (`list.sortRelationalPicked`, in every locale pack) says that a linked column sorts by the stored ID, only while the current sort names one.
- **One footer row on an aggregated list.** `ObjectGrid` gains an `onColumnSummaryChange` host prop: when it is passed the grid draws no summary row of its own and reports, in column order, what that row would draw. `ListView` passes it and draws the summaries at the right of its record-count row, truncated with the full text as their tooltip.

**Clause-②: yes (widening).** Two optional members widen published types: `ViewTabItem.description` in `@object-ui/plugin-view` and `ObjectGridComponentProps.onColumnSummaryChange` in `@object-ui/plugin-grid`. Both are host props on React components, never authored metadata.
