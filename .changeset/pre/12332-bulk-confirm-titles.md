---
'@object-ui/plugin-grid': patch
---

A bulk action's confirm step now lists the affected records by their display title (the object's `nameField`, through the shared ADR-0079 resolver) instead of raw ids, for objects whose title field is not `name` — on both the per-record and the aggregate path (objectui#12332).
