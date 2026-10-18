---
'@object-ui/core': minor
---

New `isDeadlineSettled(field, row, { scope, fields })` (objectui#11815). It answers whether a declared deadline is settled for one row: `true` only when the field declares `dueLike: true` and a `settledWhen` predicate that holds for the row, evaluated with `evalRowPredicate` (the row bound as `record`). A field that is not a declared deadline, a field with no `settledWhen`, and a predicate that fails to evaluate all answer `false`. Every view that draws a date cell beside a record uses it to set the cell's `deadlineSettled`.
