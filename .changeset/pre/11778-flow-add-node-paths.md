---
'@object-ui/app-shell': patch
---

The flow designer's three ways to add a node agree: each opens the add-node palette, the picked node goes into the flow's path and is laid out, and the node inspector's Node Type list is the palette's list (objectui#11778).

- **The "+" on an edge and a node's "Add connected node" ask for the type.** Both used to add a "Create record" node at once. They now open the same grouped, searchable palette as the toolbar's Add node, with its Recently used group, and add the node you pick.
- **The new node goes into the path.** The "+" on an edge splits that edge, as before. Add connected node and the toolbar's Add node put the node after a node: the node whose "+" you pressed, or for the toolbar the selected node, else Start. When that node has one way on, the new node goes between it and the next node. When it has none, the new node follows it. A decision, an approval, or a node that already leads to two or more nodes gets the new node as a new branch, as before. With End selected, the toolbar puts the new node before End. The toolbar used to start a second branch from the selected node, or add a node with no connection at all when nothing was selected.
- **The new node is laid out.** A node inserted on an edge was pinned halfway between the edge's two ends, on top of the card above it. It now has no stored position, so the canvas lays it out on its own row and moves the nodes below it down. Nodes you have dragged keep their positions.
- **The Node Type list is the palette's.** It offers every node type the palette offers, under the palette's names, so a node can now be changed into a Notify node. It no longer shows raw type names such as `http_request`, `connector_action` or `try_catch`. It no longer offers a type the palette does not add, such as Start, or `http_request`, the older spelling of the palette's HTTP request (`http`). A node whose stored type the palette does not list, such as Start, still shows that type under its name.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
