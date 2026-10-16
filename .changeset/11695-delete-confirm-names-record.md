---
'@object-ui/core': minor
'@object-ui/app-shell': minor
'@object-ui/plugin-view': minor
'@object-ui/i18n': minor
---

A record delete confirmation now names what it deletes and confirms with a destructive "Delete" button (objectui#11695).

Deleting a row from an object list, a selection of rows, or a record from its own page opened a dialog titled "Confirm Action" with a "Continue" button in the primary style, and nothing in it said which record was about to go. The dialog now:

- titles one record by the object label and the record's display name, for example `Delete Product "QA Widget 0"?`. The name comes from the same resolver the record header and lookups use, so an object's declared `nameField` is honoured;
- titles a selection by its size and the object label, for example `Delete 3 Product records?`;
- labels its confirm button "Delete" and paints it in the destructive button style.

The body is unchanged: the plain delete question, the batch question, or, for a package-owned permission set, the reset question from ADR-0094. The record page's Delete now asks that same question, so a package-owned permission set deleted from its own page also gets the reset question instead of the plain one.

The three dialogs (the console list's row and bulk Delete, the record page's Delete, and the registered `object-view`'s grid Delete) take this copy from one place:

- `@object-ui/core`: `recordDelete.confirmCopy(deps, target)` returns `{ title, message, confirmText }` for one record (`{ record }`) or a batch (`{ count }`). The `ConfirmationHandler` options gain `destructive?: boolean`.
- `@object-ui/app-shell`: `ActionConfirmDialog` paints the confirm button destructive when `options.destructive` is set. `useObjectActions` accepts `objectDef` and returns `deleteRecords(records)` for a confirmed batch delete. `deleteRecord` now asks through `onConfirm` with the full copy before the delete runs, rather than through the action runner's one-argument confirm. The console list passes its translated object label, so the delete toasts read the same label the page header shows.
- `@object-ui/i18n`: new keys in all ten packs: `objectActions.deleteConfirmTitle`, the `objectActions.bulkDeleteConfirmTitle` count family, and `objectActions.deleteConfirmButton`.

Other confirmations are unchanged. They keep the `actionConfirm.*` title and "Continue" button and the primary style.
