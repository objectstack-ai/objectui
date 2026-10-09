---
'@object-ui/plugin-kanban': minor
---

The `object-kanban` registration no longer declares `objectName` required, so
the page compile accepts a board whose `dataSource` binding names the object, and
a board that names its object in neither place shows a hint instead of an empty
board (objectui#11605).

`@objectstack/spec`'s `object-kanban` row leaves `objectName` optional, because
the node's `dataSource` binding can supply it, and the renderer agrees:
`dataSource.object` lands on `objectName` before the board reads the node. The
registration still declared `required: true`, and the page compile reads the
registration, so a bound board with no `objectName` of its own was refused with
`missing-required-prop` and the save failed.

**Clause-②: yes (widening)** — an `object-kanban` node that names its object
through `dataSource.object` and sets no `objectName` now compiles and saves. A
node that names its object in neither place also compiles now, and the board
shows "No object named: set objectName or dataSource.object." where it used to
draw an empty board reading "No cards". A board with rows from inline `data`
(an empty array included), a `bind` path or a parent view shows no hint and
renders as before. The published `objectName` input now carries a description
that says the binding can supply it.
