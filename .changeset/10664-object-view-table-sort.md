---
'@object-ui/plugin-view': patch
---

The object view's own read for a non-grid view (calendar, kanban and the other views it fetches for) re-reads when `table.sort` changes (objectui#10664).

That read falls back to `table.sort` for its `$orderby` when neither the named view nor the active view declares a sort, but a change to `table.sort` alone did not re-run it, so the view kept the old order. It now keys the read on that sort's content, so an equal sort in a new array does not re-read.
