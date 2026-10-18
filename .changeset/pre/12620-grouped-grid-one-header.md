---
'@object-ui/types': minor
'@object-ui/components': minor
'@object-ui/plugin-grid': patch
---

A grouped grid now draws one table with one sticky column header. Each group is a 36 px band row between the rows: a chevron, the group value and its count, in one cell that spans every column. Collapsing a band hides that group's rows only, and the columns keep one width across every band. The same layout applies when the server groups the rows, where a group's own pager sits under its rows.

`data-table` gains `rowGroups`, a runtime slot the host fills with the bands and their rows. A client-side sort orders rows within each band. The JSON schema refuses `rowGroups` when authored, as it refuses `renderCellEditor`.
