---
'@object-ui/app-shell': patch
---

The metadata-admin dashboard preview's reorder handler takes `DashboardComponentSchema['widgets']`, the array `DashboardRenderer`'s `onWidgetsReorder` now hands back (objectui#11514). Type-only: the preview patches the same reordered array as before.
