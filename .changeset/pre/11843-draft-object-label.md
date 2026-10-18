---
'@object-ui/app-shell': patch
---

Studio's Objects rail lists an object that is still only a draft by the label its draft declares, not by its API name (objectui#11843).

A package's draft-only object labelled "Repair Ticket" used to be listed as `repairs_repair_ticket`, while a published object beside it showed its label. The rail now takes a draft-only object's label from the package's draft-overlaid object list, which serves each pending draft with its own label.

- A draft-only object that declares no label is still listed by its name.
- A published object keeps its published label, even while a pending draft of it declares another one.
- The rail lists the same objects in the same order as before: the published objects, then the draft-only ones.
- If the draft-overlaid read fails, or the server does not serve pending drafts to you, the rail lists draft-only objects by name, as before.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
