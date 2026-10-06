---
'@object-ui/components': patch
---

The data table sizes an auto-width column from what its cells draw, and a right-pinned column no longer covers another one (objectui#11682).

**Auto width.** A column with no `width` was estimated from the length of its stored value. A currency cell stores `200000` and draws `200,000.00`, so it truncated. A lookup stores an id and draws a name, and a date stores an ISO string and draws `Feb 3, 2027`, so those columns were too wide. On the showcase's Tasks list at a 1440px viewport the columns added up to more than the list's width, and the right-aligned Progress percentage sat under the right-pinned Actions column.

The table now reads back what each auto-sized column's header and cells drew. Where the page is laid out, the column gets the width its widest drawn cell and its header need to render whole, padding included. Where nothing is laid out, the drawn text's length is the estimate's input, at the same 8px a character as before. The stored value is read only before the first draw. The 80px floor and the 400px cap stay. A masked column is still sized from its header alone. An explicit `width`, a `fitContent` column and a width the user dragged are unchanged. The width follows the rows that are drawn, so on a table that pages, searches or sorts its own rows it can change with the page, the search or the sort.

**Right-pinned columns.** Every right-pinned column stuck at `right: 0`, so a column an author pinned right beside the auto-pinned row-actions column was drawn under it. Each one now sticks at the measured width of the pinned columns after it, as left-pinned columns already do. A table with one right-pinned column renders as before.

Nothing is added to the package entry: no export, prop, type member or schema key.
