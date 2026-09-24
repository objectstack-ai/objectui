---
'@object-ui/plugin-view': minor
---

The grid's row Delete and bulk Delete now delete the record when `ObjectView` renders the grid itself — the registered `object-view` renderer, with no host list view (objectui#10383).

`ObjectGrid` hands the clicked row, or the selection, to its `onDelete` / `onBulkDelete` consumer and leaves the delete to it. `ObjectView`'s two handlers ignored the record and only refreshed, so a Delete the grid offers by default asked no question, called `dataSource.delete` zero times, and the row was still there after the refresh.

They now behave the way the console's own object list does:

- a row Delete asks "Are you sure you want to delete this record?"; a bulk Delete asks once for the whole selection ("Delete N selected records? This cannot be undone.");
- Continue calls `dataSource.delete(objectName, id)` for each record, then refreshes the grid, so the deleted rows are gone; Cancel deletes nothing;
- the outcome is reported with the console's toasts: "LABEL deleted successfully" / "Deleted N LABEL records", or "Failed to delete LABEL" (with the error message, and no refresh) / "N deleted, M failed".

The dialog and toast texts reuse the translation keys the console already resolves, so they read the same in every shipped language. Whether Delete is offered at all is unchanged — it is still the grid's own verdict, the same one the console list uses: `operations.delete`, the principal's delete grant, the object's lifecycle and `userActions`, its API operations and the per-record verdict.
