---
'@object-ui/plugin-grid': patch
---

Grouped grid lists whose columns are objects load their rows again, instead of
showing INVALID_FIELD in every group (objectui#11105).

A list view that groups its rows and writes its `columns` as objects
(`{ field, width, … }`) asked the server for the column objects themselves in
`select`. They went over the wire as `[object Object]`. Since grids group on
the server (objectui#7189), every group's row page carries that `select`. A
server that refuses unknown select keys, as `@objectstack` 17.5 does, answered
each group with `Unknown field '[object Object]'`, so no group showed its rows.

The grid now reads each entry's field name the same way whether it arrives as
`fields` or `columns`, and asks only for those names (plus `id`, the grouping
fields and the fields its row predicates read). An entry with no field name is
left out of the query. Views whose columns are plain field-name strings ask for
exactly what they asked for before.
