---
'@object-ui/fields': minor
---

`resolveRecordPointer` reads `referenceDeletedWhen`, so a pointer pair can say the platform deleted its target (objectui#12489).

`@objectstack/spec`'s `FieldSchema.referenceDeletedWhen: { field, value }` sits beside `referenceVia` and names a sibling `select` field and one of its options. On a row whose sibling holds that option, the platform has asserted that the record the pointer names was deleted. `resolveRecordPointer(field, row, optionsOf)` now evaluates that predicate in the same call that resolves the pair. When it holds, the pair comes back with `deletedLabel`, the declared option's label taken from `optionsOf(field)`, the option list the call site draws `select` cells with. With no `optionsOf`, or no option with that value, the pair comes back as before. The spec refuses an undeclared option at parse, and the raw option value is never used as the text.

The default face under `RECORD_POINTER_CARD_TYPE` draws `deletedLabel` in place of the record id. A field without `referenceDeletedWhen`, or a row whose sibling holds anything else, draws exactly as before.

**Clause-②: yes (widening)**: the exported `RecordPointer` type gains the optional `deletedLabel`, `resolveRecordPointer`'s field parameter gains the optional `referenceDeletedWhen`, and the function gains an optional third parameter, `optionsOf`. Nothing narrows: every existing argument and return shape still type-checks and resolves as before. No new export.
