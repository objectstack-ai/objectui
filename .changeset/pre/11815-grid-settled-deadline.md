---
'@object-ui/plugin-grid': minor
---

A done row's past deadline no longer reads overdue in the grid (objectui#11815). Every column shape — object columns, name columns, inline-row fields and the object's default columns — now carries the field's `dueLike` and `settledWhen`, and each cell is told whether its row's deadline is settled. Before, three of the four column shapes dropped `dueLike`, so a declared deadline only read overdue when its name happened to look like one. When the grid fetches its own rows, it also asks for the fields a shown deadline's `settledWhen` reads, so a grid showing only Title and Due Date still judges each row correctly.
