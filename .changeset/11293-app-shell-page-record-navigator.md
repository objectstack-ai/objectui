---
'@object-ui/app-shell': minor
---

A custom page publishes the console's record navigator to the blocks placed on it (objectui#11293).

A block on a custom page is rendered with no host callback, so an `object-kanban` or `object-calendar` whose `navigation` resolves to `page` had nowhere to go: the record page and the object list page publish a record navigator on `RelatedRecordActionsContext`, and `PageView` published none. It now publishes one for the objects the console can route to, addressing `/apps/APP/OBJECT/record/ID`, so a `page` click on a page block opens that record page. `resolve` returns no related-list handlers, as on the list page.

The same seam feeds the grid's link column and the lookup cells, so on a custom page those now render as real anchors to the record they name — as they already do on the record and list pages.
