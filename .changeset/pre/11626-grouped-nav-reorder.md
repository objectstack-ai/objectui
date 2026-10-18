---
'@object-ui/layout': patch
'@object-ui/app-shell': patch
---

Drag-to-reorder of a grouped sidebar menu, within each level (objectui#11626), was retired before it was released. objectui#12059 removed every drag-to-reorder of the sidebar menu: an app's menu order is authored in Studio, and every user sees that order. Nothing of objectui#11626 ships, because objectui#12059 retires the menu reorder whole: `NavigationRenderer`'s `enableReorder` / `onReorder`, the menu drag grip, and the sidebar's per-user menu order in localStorage (`objectui-nav-order-APP`), each of which predates objectui#11626, are gone. The objectui#12059 changeset describes what replaced them: the pinned section is the one place a user orders entries.
