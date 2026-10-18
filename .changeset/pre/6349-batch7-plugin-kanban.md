---
'@object-ui/plugin-kanban': patch
---

The board implementation types its `conditionalFormatting` rules as `@object-ui/types`' `KanbanConditionalFormattingRule` by that name, instead of through a module-local alias named `ConditionalFormattingRule` (objectui#6349, batch 7). `@object-ui/types` publishes `ConditionalFormattingRule` for the grid's and list view's rule, so the alias put a second meaning behind that name. The alias was internal: this package's entry never exported it, so no import changes, and the rule type is the same.

No runtime behaviour changes.
