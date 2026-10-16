---
'@object-ui/components': patch
'@object-ui/types': patch
---

An inline edit in a grid is no longer written to another record when the rows are re-read in a new order (objectui#12310). The table kept each pending edit under its row's position on the page. A re-read that reordered the rows (the refresh after a row's own save, a change announced by another part of the app, a page change) then drew a kept edit on whichever record now sat in that position, and "Save All" wrote it there, with a 200 and no warning.

A pending edit now belongs to its record: the table keeps it under the row's `id`, or under the row object for a row with no `id`. Every edit is drawn, saved and flagged on its own record in whatever order the rows arrive, and an inline editor left open stays on its record. An edit whose record the rows no longer include (a re-read dropped it, or it is on another page) stays pending and counted, and "Save All" sends it with the row it was typed on. `onBatchSave` gives such an entry a negative `rowIndex` (`-1`, `-2`, …, unique within the batch), because no position in the current rows is that record's. Every other `rowIndex`, including the one `onRowSave` and `onCellChange` receive, is the row's index when the callback is called, as before, except that `onCellChange` gets `-1` if its editor's record was dropped while the editor was open.

The `onCellChange`, `onRowSave` and `onBatchSave` docs on `DataTableSchema` in `@object-ui/types` now document this negative `rowIndex` as the mark of a record the table no longer holds (`-1` for `onCellChange`; `-1`, `-2`, … in a batch, which a `{ failed }` entry names back), with the callback types unchanged.
