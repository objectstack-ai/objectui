---
'@object-ui/app-shell': patch
---

fix(app-shell): the flow designer stops warning on an edge guard that reads its source node's own outputs

The engine writes a node's outputs (a `get_record`'s `outputVariable`, a
connector action's `nodeId.key` write-back, an approval's `nodeId.decision`)
before it evaluates that node's out-edge guards. The designer resolved an
edge's scope as the scope AT its source node, which by design excludes the
node's own outputs, so `lead.status == 'open'` on the out-edge of a
`get_record` with `outputVariable: lead` was reported "not a reference in
scope" in both the edge inspector's note and the Problems panel, although the
engine writes `lead` first.

An edge's scope is now the scope at its source plus the source's own outputs,
through one rule both surfaces read (`edgeSourceOutputRefs`, composed by
`resolveEdgeScope` for the Problems panel and `useEdgeScope` for the edge
inspector). A `fault` edge keeps the scope at its source: the engine walks it
only when the node failed, with nothing written back. A reference no node
writes still warns.

`buildFlowProblems` also accepts an optional `connectors` argument (the runtime
connector registry) and threads it into the expression scan, so a host that
passes it has a committed connector action's declared output keys judged in
scope there, as the inspectors judge them.
