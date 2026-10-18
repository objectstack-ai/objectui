---
'@object-ui/app-shell': patch
---

The flow designer's Remove node takes the node's edges with it, and a new node never inherits the edges a removed one left behind (objectui#11772, the objectui half of objectstack#22088).

Removing a node from the flow inspector left every edge that named it in the draft. The next node the designer added got the same id (`node_1`), so those edges re-attached to it, drawn on top of each other where the author saw one line. A published flow then ran that node once per edge: one record update created the same follow-up record three times.

- **Remove node removes the node's edges in the same change.** When the node sat on a single path (one edge in, and one edge out with no condition, label or default flag), its predecessor is reconnected to its successor through the edge that led in, which keeps its id, condition, label and position. So removing a node that was inserted on a connection gives that connection back. A decision, a join, or a node whose edge out carries a condition or label loses its edges and is not reconnected. The canvas's Delete key makes the same removal.
- **A new node never takes an id the editing session has seen**, on a node or at either end of an edge. A flow saved with an edge to a missing node no longer hands that edge to the next node added.
- **The Problems panel flags a repeated connection**: an edge that joins the same two nodes the same way (the same type, condition, default flag and label) as an earlier edge. Each extra copy is its own row, and clicking the row selects that copy so the author can remove it. Two edges that join the same nodes differently, such as two decision branches leading to one node, are not flagged. An edge to a missing node was already flagged. Stored flows are not rewritten: these rows are how an author finds and repairs one.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new Problems-panel row lives in the metadata-admin designer's own string tables (en and zh).
