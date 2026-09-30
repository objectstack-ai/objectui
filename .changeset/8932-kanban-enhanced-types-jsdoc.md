---
'@object-ui/types': patch
---

The JSDoc on `KanbanCard`, `KanbanColumn.cards` and `ObjectKanbanSchema.columns` no longer names `KanbanEnhanced` as a board that reads these members. `KanbanImpl` has been the one kanban board since objectui#8932 deleted that module, and the older counts that included it now carry a date. Only comments change; no type moves.
