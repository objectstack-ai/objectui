---
'@object-ui/plugin-grid': minor
---

The `object-grid` and `view:grid` registrations no longer declare `objectName`
required, so the page compile accepts a node whose `dataSource` binding names the
object (objectui#11605).

`@objectstack/spec`'s `object-grid` row leaves `objectName` optional, because the
node's `dataSource` binding can supply it, and the renderer agrees:
`dataSource.object` lands on `objectName` before the grid reads the node. The
registration still declared `required: true`, and the page compile reads the
registration, so a bound node with no `objectName` of its own was refused with
`missing-required-prop` and the save failed.

**Clause-②: yes (widening)** — an `object-grid` (or `view:grid`) node that names
its object through `dataSource.object` and sets no `objectName` now compiles and
saves. A node that names its object in neither place also compiles now; the grid
answers it at runtime with its own "Object name required for data fetching"
error, as it did before when such a node reached it. The published `objectName`
input now carries a description that says the binding can supply it.
