---
'@object-ui/app-shell': patch
---

Studio's flow designer connects two nodes the flow already has (objectui#11905).

- **Canvas.** Every card except an End now has a connect handle on its bottom edge, beside its "+". Press it, drag, and drop on another node to connect the two. Until now the canvas drew an edge only while adding a node, so a node left without one could only be deleted and added again, which lost its configuration. The new edge is the one the "+" on that node would draw: it gets a fresh id, and out of a decision it carries that decision's next branch. Only the flow's edges are written, so a reconnected node keeps its configuration exactly as stored. Releasing over no node writes nothing.
- **Connection inspector.** *From* and *To* are now pickers over the flow's nodes instead of read-only text, and they write through the same patch as the panel's other fields. An endpoint that names a node the flow does not have shows flagged, and picking a real node repairs the edge.
- **One rule for both.** Either way, a connection is refused, with the reason shown and nothing written, when it would join a node to itself, join two nodes another edge already joins, or name a node the flow does not have.

Nothing is added to a package entry: no export, prop, type member or language-pack key.
