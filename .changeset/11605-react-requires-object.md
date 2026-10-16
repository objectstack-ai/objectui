---
'@object-ui/react': minor
---

`ElementDataSourceGate` takes a `requiresObject` prop: when a placement opts in
and its node names its object in neither place, the gate renders a short "no
object named" hint instead of the block (objectui#11605).

The object-bound registrations stopped declaring their object key required,
because the `dataSource` binding can supply it and the page compile has no "this
key or that binding" form. So the page compile accepts a node that names no
object at all, and the runtime's answer is the only signal left for it. Several
blocks answered such a node with an empty list, board, form, chart, dash or pivot,
which reads as an empty query.

**Clause-②: yes (widening)** — `ElementDataSourceGateProps` gains the optional
`requiresObject` boolean. With it set, the gate reads the mapping's object key
(`objectName` unless the mapping names another) on the node after the binding
lands, so a node bound by `dataSource.object` renders as before; a node that names
no object gets the hint, "No object named: set objectName or dataSource.object."
(`data-testid` `{testId}-no-object`), and the block is not mounted. Without the
prop, or with a mapping whose `object` is `false`, nothing changes. The hint is
drawn after the view states, so a binding that is still resolving or failed to
resolve keeps its own panel.
