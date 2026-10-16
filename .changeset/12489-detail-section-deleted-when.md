---
'@object-ui/plugin-detail': minor
---

The details grid passes a pointer field's `referenceDeletedWhen` to `resolveRecordPointer` (objectui#12489).

`DetailSection` hands the rule the object field's `referenceDeletedWhen` beside `referenceVia`, and the sibling field's options translated exactly as the grid translates a `select` field's options. So the tombstone a pointer face draws reads as the option reads in its own cell, localized labels included. The predicate is evaluated in `@object-ui/fields`, not here. A field without the key draws as before.

**Clause-②: yes (widening)**: the grid hands the pointer face one more state. No export, prop or type changes, and nothing narrows.
