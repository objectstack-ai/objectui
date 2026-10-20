---
'@object-ui/app-shell': patch
---

The flow designer names a node by its label in three more places (objectui#13200), through the same rule as objectui#13143: the author's label, else the palette label of the node's type, else the id.

- **Problems, unreachable node.** The warning reads `Node "Notify team" (node_3) is unreachable from the entry.`. The id stays beside the label, as in the decision messages, because two nodes can share a label (en and zh).
- **Problems target column.** A row's target shows the node's name, and a connection as `name → name`. The ids are in the cell's tooltip.
- **Selection labels.** The label written when a problem is clicked, a node or connection is selected on the canvas, a node is added, or "Edit connection" is pressed now uses the same rule. A branch card's target in the decision inspector does too, with an unlabelled target's palette label in the designer's language.

Nothing is added to the package entry.
