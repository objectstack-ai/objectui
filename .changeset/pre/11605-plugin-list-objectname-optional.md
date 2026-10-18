---
'@object-ui/plugin-list': minor
---

The `list-view` and `view:list` registrations no longer declare `objectName`
required, so the page compile accepts a node whose `dataSource` binding names the
object, and a list that names its object in neither place shows a hint instead of
an empty list (objectui#11605).

`list-view` has no spec row. The binding doc says a node bound by
`dataSource.object` needs no `objectName` of its own, and the schema validator
counts the binding as a `list-view` record source. The renderer agrees:
`dataSource.object` lands on `objectName` before the list reads the node. The
registrations still declared `required: true`, and the page compile reads them,
so a bound list with no `objectName` of its own was refused with
`missing-required-prop` and the save failed.

**Clause-②: yes (widening)** — a `list-view` (or `view:list`) node that names its
object through `dataSource.object` and sets no `objectName` now compiles and
saves. A node that names its object in neither place also compiles now, and the
list shows "No object named: set objectName or dataSource.object." where it used
to draw the "Nothing here yet" empty state. A list with inline `data` shows no
hint and renders as before. The published `objectName` input now carries a
description that says the binding can supply it.
