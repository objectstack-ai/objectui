---
'@object-ui/fields': patch
---

The date and datetime cells read a declared `dueLike: false` ahead of the field-name convention (objectui#12726). `@objectstack/spec` says a `dueLike` that is absent or `false` means the date is not a deadline. Before this change only `true` was read, so a field named like a deadline (`due_date`) that declared `dueLike: false` still drew "Overdue Nd" in red. A field that declares no `dueLike` is judged by its name exactly as before.

The grid and the record page use this `false` to tell the cell that a row's deadline is settled, so a returned loan's due date stops reading overdue.

Clause-②: no
