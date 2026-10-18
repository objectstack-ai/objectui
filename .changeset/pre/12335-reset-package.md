---
'@object-ui/data-objectstack': patch
'@object-ui/app-shell': patch
'@object-ui/plugin-designer': patch
---

A console reset, delete or draft discard names the package whose row it removes (objectui#12335, the consumer half of objectstack#23165).

Since `@objectstack/rest` 18.0.0-next.1 the metadata delete door reads `?package=`. A delete that names no package addresses the one package that holds the item; when two or more packages hold it the door refuses `409 RESOURCE_CONFLICT`, deletes nothing, and names `?package=` as the remedy. The console could not send that remedy.

- **`MetadataClient.reset()`** now sends `?package=` when `options.packageId` is set, beside `?state=draft` for a draft discard, with the spelling `save()` and `publish()` use. Without a binding the parameter is omitted, never sent empty. Its options type already declared `packageId` (inherited by `MetadataDeleteOptions`); `reset()` used to drop it. No exported type changes.
- **The metadata editor** (`MetadataResourceEditPage`): Reset/Delete and "Discard draft" state the package the editor's save and publish already state, read from `?package=` on the editor URL (the `all` scope names none). An editor with no package sends none, and a refusal is shown on the page's error line in the server's words.
- **The Objects page** (`MetadataObjectsPage`, `@object-ui/plugin-designer`): deleting an object states the package the listed row is served from (its `_packageId`). A row no package owns, including one served with the `sys_metadata` sentinel, sends none, and a refusal is shown in the page's error panel.
- **Unchanged:** the runtime draft bar's Discard and the adapter's `deleteView` hold no package binding, so they keep the package-less delete. Their refusals already reach the caller: the draft bar shows the server's message in its error toast, and `deleteView` throws.
