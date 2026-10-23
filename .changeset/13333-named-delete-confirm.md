---
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
'@object-ui/i18n': patch
---

Setup's metadata deletes and the related list's row delete now ask in the console's in-app confirm dialog and name what goes (objectui#13333).

- The metadata editor's Reset overlay / Delete and Discard draft, the history timeline's Rollback, the Datasources page's Delete and a metadata type's `confirmText` action no longer use the browser's native `confirm()`. Each opens an in-app AlertDialog whose title names the item: by its type label and its own label for Reset / Delete (for example `Delete Object "Account"?`), with the machine `type/name` in the body; by label and name for a datasource; by action and item for a type action.
- The related list's row Delete no longer asks "Are you sure you want to delete this record?". The sentence names the row by its record title, the same resolver the record header uses, so a grant row reads by its declared title (the grant and the user it belongs to). The `detail.deleteRowConfirmation` string now takes a `{{name}}` value in all ten locales.
