---
'@object-ui/components': patch
---

`data-table`'s header context menu no longer offers Sort ascending / Sort descending on a column declared `sortable: false` (objectui#10727).

The header of such a column already refused a sort: no pointer cursor, no click, no
indicator. Its context menu did not ask the column, only whether the table sorts at all, so
the same column could still be sorted from the menu. The menu now offers its sort entries
exactly where the header sorts, through the same check over the same column, so the two
controls cannot disagree. A `masked` column stays without sort entries, as before.

This reaches every host that marks a column unsortable. `object-grid` does so for a column
the server cannot honestly order by, a relational column or an unmaterialized `formula`
column, and its menu turned that withheld sort into a refetch naming the field. On a backend
that serves no per-column sortability, a platform that answers `400 INVALID_SORT` refused
the formula column's refetch and the grid showed the error in place of its rows. Sortable
columns keep both menu entries, with client and manual sorting alike.
