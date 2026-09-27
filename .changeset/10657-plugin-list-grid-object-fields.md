---
'@object-ui/plugin-list': patch
---

`ListView` hands its grid the object's field types together with the rows, so the grid draws a `password` / `secret` column masked from its first paint (objectui#10657, which folded objectui#10706).

`ListView` fetches the rows and hands them to `object-grid` as `data`, and those rows
painted before the grid's own read of the object definition settled. In that window an
untyped column over a `password` / `secret` field had no type: it drew the raw value, and
since `object-grid` now withholds such a column instead, it would draw the mask for every
untyped column until the read lands. `ListView` reads the object definition before it
fetches the rows, so it now passes the definition's fields to the grid as `objectFields`
with them, and the grid has no window at all. Only the grid view is handed it. When the
definition could not be read, nothing is passed and the grid withholds on its own.
