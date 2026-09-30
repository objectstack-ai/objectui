---
---

Correct two stale text sites: the `ObjectDataTable.onRowClick` docblock paraphrase in
`packages/types/src/data-display.ts` (it dropped the `recordDrillEnabled` gate), and the
"not in this change" sentence in `.changeset/9462-row-click-modifier-payload-forward.md`
(`ObjectDataTableSchema.onRowClick` was widened separately, by objectui#9799, not left at
one parameter). No published behaviour changes.
