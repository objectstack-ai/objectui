---
'@object-ui/plugin-charts': minor
---

The `object-chart` and `view:chart` registrations no longer declare `objectName`
required, so the page compile accepts a node whose `dataSource` binding names the
object, and a chart that names its object in neither place shows a hint instead
of an empty frame (objectui#11605).

`object-chart` has no spec row. The binding doc says a node bound by
`dataSource.object` needs no `objectName` of its own, and the renderer agrees:
`dataSource.object` lands on `objectName` before the chart reads the node. The
registrations still declared `required: true`, and the page compile reads them,
so a bound chart with no `objectName` of its own was refused with
`missing-required-prop` and the save failed.

**Clause-②: yes (widening)** — an `object-chart` (or `view:chart`) node that
names its object through `dataSource.object` and sets no `objectName` now
compiles and saves. A node that names its object in neither place also compiles
now, and the chart shows "No object named: set objectName or dataSource.object."
where it used to draw an empty frame with no message. A chart with inline
`data`, a `dataset` or a `bind` path shows no hint and renders as before. The
published `objectName` inputs now carry a description that says the binding can
supply them.
