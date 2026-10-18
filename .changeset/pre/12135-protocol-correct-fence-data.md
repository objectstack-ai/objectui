---
---

No package released: one teaching fence in the published `skills/objectui` bundle, which ships through `npx skills add` and sits in no package's `files[]`. The "CORRECT" `data-table` example under "Rule: No Schema Property Invention" in `skills/objectui/rules/protocol.md` gains the inline `data` array `DataTableSchema` declares as required, so the node the skill tells an agent to copy is one both authoring faces accept instead of one `objectui validate` refuses with `data: Invalid input: expected array, received undefined` (objectui#12135).
