---
'@object-ui/plugin-grid': patch
---

On `object-grid`, a masked column is now also left out of the table's client-side search, never sorted by, and sized from its header (objectui#10657, which folded objectui#10658).

`object-grid` already set `TableColumn.masked` on every column whose field is drawn as a mask
(objectui#10583). Where the grid lets the table search and sort in the browser (inline
`data`, or a grouped view), the table still matched a search term against the raw value,
sorted by it from the header and the header menu, and sized the column from its length.
The table now refuses all three for a masked column (`@object-ui/components`); the grid's
own source is unchanged, and its README no longer lists these under "Not covered".

What stays not covered on the grid is unchanged: the host-fetched path's window before the
object schema arrives (objectui#10706's row of objectui#10657), the server-streamed export,
and expanded lookup records in the client JSON export.

This is defence in depth. The real guard is still the server: ObjectStack's read mask
replaces `secret` and `password` values with its mask before they reach the browser.
