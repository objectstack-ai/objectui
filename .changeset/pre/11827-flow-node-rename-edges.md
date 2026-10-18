---
'@object-ui/app-shell': patch
---

Renaming a node in the flow designer keeps it connected: the node inspector's ID field renames the node's edges with it, and only a finished, unique id is ever applied (objectui#11827).

The ID field used to apply each keystroke as a rename of its own and change only the node. Every edge kept naming the old id, so the renamed node was left with no connections, and a published flow never ran it. The inspector also lost the node after the first character typed.

- **The rename applies when you leave the field or press Enter.** Typing writes nothing until then, and Escape puts the current id back.
- **The node's edges follow the rename in the same change.** Every edge that started or ended at the old id now names the new one, and keeps its id, condition, label, default flag and position. A boundary event attached to the node stays attached to it. The inspector and the canvas stay on the renamed node.
- **An id that cannot be used is refused under the field, and nothing changes.** That is an empty id, an id another node in the flow already has (including a node inside a loop, parallel or try/catch region), or an id an edge still names after its node was removed. The field shows the current id again, and the message says why.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new messages live in the metadata-admin designer's own string tables (en and zh).
