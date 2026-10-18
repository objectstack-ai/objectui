---
'@object-ui/plugin-grid': patch
'@object-ui/plugin-list': patch
'@object-ui/components': minor
'@object-ui/types': minor
---

A grid's inline-edit save no longer overwrites a concurrent write without a word (objectui#12292). The grid's default row save and "Save All" now send each row's `updated_at` as `If-Match`, the way the record forms and the record page's inline edit already do. A stale grid edit is refused with `409` instead of landing with a `200`. The refusal opens the same conflict dialog the record page opens (`ConcurrentUpdateDialog`, offering Reload latest, Overwrite anyway or Cancel). After a save, the row's next save sends the token of the record the server answered with, so saving the same row twice does not conflict with your own first save.

The rows now carry that token. An inline-editable grid, and a list view in inline-edit mode, add `updated_at` to the query's `$select` even when no column shows it. Before, the token was missing from every row unless a column displayed it, so there was nothing to send.

"Save All" reports each row on its own. A row that is refused (a conflict you cancel, a validation error) stays pending and flagged, and the rows that saved are cleared, not reported as failed and not sent again. Nothing the server accepted is rolled back.

**Type change, additive.** `DataTableSchema.onBatchSave` may now resolve with `{ failed: Array<{ rowIndex, error }> }`, naming the rows that did not persist by the `rowIndex` they were handed. The table keeps and flags exactly those rows. A handler that resolves with nothing or rejects is read exactly as before, so existing handlers need no change.
