---
'@object-ui/app-shell': minor
---

The flow canvas's node cards and the Studio's node configuration aside take the Automations redesign (objectui#12488, epic objectui#12446).

- **Node cards**, in the Studio canvas and the metadata-admin designer alike: an 8 px card with a 28 px tile tinted by kind (start green, screen pink, record blue, decision amber, loop violet, end grey), the label in 13 px semibold, and the kind by its display name in small capitals with the step's summary in mono beside it; the raw node type is on the kind's tooltip. A selected card carries the primary border and a soft 3 px ring. Layout and edges are unchanged.
- **One header in the Studio aside.** With a node or connection selected, the Automations aside's header names it ("Node · Decision", the node's label, close) and the inspector under it no longer draws a second header. With nothing selected it still reads "Configuration".
- **A decision's Branches as cards.** Each branch is a card with its target node in the header and its label and expression under it, the expression in a mono text area; "Add branch" is a dashed button. Edits write exactly what the Branches list wrote. A decision that routes on its connections' conditions, with no Branches of its own, now lists each connection as a read-only card with its target and condition, where the list used to read "No items yet."; in the Studio, a card's "Edit connection" opens that connection.
