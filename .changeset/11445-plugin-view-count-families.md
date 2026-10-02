---
'@object-ui/plugin-view': patch
---

The object view's provider-less defaults table carries the `_one` / `_other` rows of the two count families it serves, `console.objectView.bulkDeleteConfirm` and `objectActions.bulkDeleteSuccess` (objectui#11445), so a host with no `I18nProvider` reads `Delete 1 selected record?` at one record.
