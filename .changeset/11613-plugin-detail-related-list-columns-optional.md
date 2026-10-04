---
'@object-ui/plugin-detail': minor
---

The `record:related_list` registration no longer declares `columns` required, so
the page compile accepts a related list that lists no columns of its own
(objectui#11613).

`@objectstack/spec`'s `record:related_list` row leaves `columns` optional, and the
renderer agrees: a `dataSource` binding that names a view lands that view's
columns on the node, and with neither the list derives its columns from the
related object (its `highlightFields`, otherwise its listable fields). The
registration still declared `required: true`, and the page compile reads the
registration, so a node with no `columns` was refused with
`missing-required-prop` and the save failed.

**Clause-②: yes (widening)** — a `record:related_list` node that sets no `columns`
now compiles and saves, whether a `dataSource` binding names a view (the list
draws the view's columns) or not (the list draws columns derived from the related
object, as it already did when such a node reached it). Authored `columns` still
win over both. `objectName` and `relationshipField` are still required, as the
spec row requires them. The published `columns` input now carries a description
that says where the columns come from when it is absent.
