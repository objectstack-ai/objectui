---
'@object-ui/plugin-form': minor
---

The `record:line_items` registration no longer declares `childObject` required,
so the page compile accepts a node whose `dataSource` binding names the child
object (objectui#11569).

`@objectstack/spec`'s `record:line_items` row leaves `childObject` optional,
because the node's `dataSource` binding can supply it, and the renderer agrees:
`dataSource.object` lands on `childObject` before the panel reads the node. The
registration still declared `required: true`, and the page compile reads the
registration, so a bound node with no `childObject` of its own was refused with
`missing-required-prop` and the save failed.

**Clause-②: yes (widening)** — a `record:line_items` node that names its child object
through `dataSource.object` and sets no `childObject` now compiles and saves. A
node that names its child object in neither place also compiles now: the panel
shows its configuration hint naming `childObject` and loads nothing, as it did
before when such a node reached it. `relationshipField` and `columns` are still
required. The published `childObject` input now carries a description that says
the binding can supply it.
