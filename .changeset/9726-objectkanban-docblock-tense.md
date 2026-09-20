---
---

Comment-only repair in `@object-ui/plugin-kanban`: two `ObjectKanban.tsx` docblocks no longer state which published schema face declares which kanban key. That inventory had gone false for three of the five keys it named, and `tsc` already answers the question off `ObjectKanbanSchema`. No published behaviour changes and nothing is released by this entry.
