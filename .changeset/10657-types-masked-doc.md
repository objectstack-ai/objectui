---
'@object-ui/types': patch
---

`TableColumn.masked`'s documentation and its zod `describe()` text now list every path the table withholds, and name the three producers that set the flag (objectui#10657, which folded objectui#10658).

The table now also leaves a masked column out of its client-side search, disables its
sort and sizes it from its header (`@object-ui/components`), and `RelatedList` and
`object-data-table` now set the flag as `object-grid` does. The JSDoc and the
`describe()` text on `TableColumnSchema.masked` said the opposite, so they are rewritten.
The docs also state the fail-closed window the related list and `object-data-table` keep
while the object definition is loading or after its read failed, and what that window
does not cover. No type or schema shape changes.
