---
'@object-ui/plugin-list': patch
---

A list view that shows a declared deadline but not the field its `settledWhen` reads now fetches that field, so a done record's past due date reads neutral instead of overdue (objectui#11815). A field the viewer may not read is still never requested; that deadline stays unsettled.
