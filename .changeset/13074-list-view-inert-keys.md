---
'@object-ui/plugin-list': minor
---

A page `list-view` node now honours `requiredPermissions`, a key of the spec's list view row, and the registration publishes it (objectui#13074): the capabilities a viewer must all hold. A viewer missing one sees an insufficient-permissions notice in place of the list, the same notice the record blocks draw, and no records are queried. A provider that reports no capabilities still shows the list.

`addRecord` and `sharing` stay unpublished. With `addRecord.enabled`, the Add button calls the `onCreate` a `RelatedRecordActionsContext` provider serves for the listed object, and is withheld, not drawn dead, where no provider serves one. `sharing`'s Share button has no action the spec declares.
