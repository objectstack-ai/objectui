---
---

Pin the root README's "Kanban Board" example against the shipped
`safeValidateSchema` (objectui#8256), and repair the example: its lanes were
`{ value, label, color }`, which is neither arm of `ObjectKanbanSchema.columns`,
so the whole board was refused at `columns`. Test and documentation only; no
published behaviour changes and no package is released by this change.
