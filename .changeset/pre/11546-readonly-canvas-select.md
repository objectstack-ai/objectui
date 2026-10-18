---
'@object-ui/app-shell': patch
---

On a read-only package, a click on a flow canvas node in Studio Automations selects the node and opens its inspector read-only again (objectui#11546).

On a read-only canvas the node's press stopped short of claiming the event, so it reached the
canvas background. The background cleared the selection and took the pointer, and the browser
then fired the click at the canvas instead of the node, so the inspector rail kept its empty
state and a packaged flow's node configuration could not be read.

A press on a node in the designer now belongs to the node on a read-only canvas too. The click
selects the node and the inspector opens with every input disabled, as objectui#11124 set out.
Only the drag is withheld: a press-and-drag on a read-only node moves nothing and writes nothing.
The editable designer drags and selects as before, and the Delete key still deletes only on an
editable canvas. Outside design mode, where a node click selects nothing, a press on a node still
pans the canvas.
