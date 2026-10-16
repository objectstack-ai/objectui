---
'@object-ui/plugin-dashboard': minor
---

The `object-metric` and `object-pivot` registrations no longer declare
`objectName` required, so the page compile accepts a node whose `dataSource`
binding names the object, and a node that names its object in neither place
shows a hint instead of a value or an empty table (objectui#11605).

`@objectstack/spec`'s `object-metric` row leaves `objectName` optional, because
the node's `dataSource` binding can supply it; `object-pivot` has no spec row,
and the binding doc says a bound node needs no `objectName` of its own. Both
renderers agree: `dataSource.object` lands on `objectName` before the block
reads the node. The registrations still declared `required: true`, and the page
compile reads them, so a bound node with no `objectName` of its own was refused
with `missing-required-prop` and the save failed.

**Clause-②: yes (widening)** — an `object-metric` or `object-pivot` node that
names its object through `dataSource.object` and sets no `objectName` now
compiles and saves. A node that names its object in neither place also compiles
now, and shows "No object named: set objectName or dataSource.object." where the
metric used to draw a bare dash and the pivot an empty state saying its query
returned no records. A metric with an authored `fallbackValue`, and a pivot with
inline `data` or a `bind` path, show no hint and render as before.
`object-data-table` is unchanged: it reads no binding, so its `objectName` stays
required. The published `objectName` inputs now carry a description that says
the binding can supply them.
