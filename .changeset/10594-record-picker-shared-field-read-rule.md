---
'@object-ui/fields': patch
---

`RecordPickerDialog` builds its display column's title from the row that `withoutDeniedFields` from `@object-ui/core` returns, and its module-private copy of that field-read rule is deleted (objectui#10594). It was the last hand-written copy of the rule; the export is now its only definition.

For a named object nothing the picker draws changes: a field the loaded policy denies is still removed before the title is built, and `id`, `_id` and the declared `idField` are still kept. The one change is an empty `objectName`: the copy judged every field but `id`, `_id` and the declared `idField` against `''`, while the export passes the row through, as the other surfaces do. The picker reads no records without an object name, so the change can show only in the single render after a host empties the object name of an open picker, before the rows of the previous object are cleared, and only in the display column.
