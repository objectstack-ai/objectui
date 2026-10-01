---
'@object-ui/fields': patch
---

fix(fields): the number cell ignores a malformed `scale` instead of flooring it or crashing

`NumberCellRenderer` took any JavaScript number in `scale` as the decimal width. A
non-integer `scale: 1.5` rendered `3.14159` as `3.1`, a width nobody declared. A
negative `scale: -1` made the cell throw a `RangeError`, which took the row down. The
cell now reads the width through `resolveFieldScale` from `@objectstack/spec/data`,
the function the percent cell, the detail view and the grid footer already use. A
malformed declaration counts as no declaration, so the value shows as stored.

A well-formed `scale`, or no `scale` at all, renders exactly as before. The grouping
rule is unchanged too: a declared `scale: 0` (a year, for example) still renders
without thousands separators, and a field with no `scale` still groups.
