---
'@object-ui/app-shell': patch
---

The object page reads the console's refresh counter (`externalRefreshKey`: record-form save, undo, redo) in the render that carries it, instead of copying it into its own counter one commit later (objectui#10572). The list now also re-reads on the data-invalidation bus, and undo and redo declare their change there in the same tick as the counter bump, so the delayed copy made one undo cost two list reads. Every reader of the page's refresh signal — the list, the saved-view and draft reads, the record count — still sees each external bump.
