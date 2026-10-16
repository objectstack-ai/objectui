---
'@object-ui/plugin-detail': patch
'@object-ui/fields': patch
---

An inline edit of a `datetime` field on the record page keeps its time (objectui#12759). The record details section and the header highlights edited `date` and `datetime` fields with the browser's native date input, a day-only control. A `datetime` showed no time there, and an edit of the day saved local midnight of that day, dropping the time the record held.

- **The platform date picker.** Both types now edit with the picker the record form, the action dialogs, the grid's inline cell editor and the kanban required-fields dialog draw (objectui#12622, objectui#12642, objectui#12664). Its placeholder and digit order follow the console locale, not the machine's.
- **A `datetime` keeps its time.** The picker shows the date and the time. A day picked in its calendar keeps the value's time, and typed text carries the time typed. The value written is an ISO instant, as before. A record at 14:30 moved to another day saves that day at 14:30.
- **A `date` field still writes `YYYY-MM-DD`** (objectui#12206), unchanged.
- **A stored day that does not exist** (`2026-02-30`) still shows an empty, invalid box with a notice naming the stored value, and nothing is written until a day is entered (objectui#10625).
- **Typed text is read when the box loses focus or on Enter.** Pressing Save moves focus to the button first, so the typed value is saved.
- `@object-ui/fields`: a code comment only, on where the picker is drawn.

Clause-②: no. No type member, prop, export or language-pack key is added or removed.
