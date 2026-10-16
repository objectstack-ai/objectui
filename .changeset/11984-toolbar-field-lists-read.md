---
'@object-ui/plugin-list': patch
---

The list toolbar's hide-fields popover, Group editor and Row color select, and its user-filter chips, no longer offer a field the user may not read (objectui#11984). They now ask the same field-level read check as the list's columns, its Filter panel and its Sort picker. The compact toolbar's View settings popover offers the same three lists and asks it too.

- **User-filter chips.** A chip on a field the user may not read is not shown, whether the author named the field or it was derived from the object definition: a value chosen on it is a filter the server refuses, and the list went blank. A chip whose field a selection already holds (the applied filter, or a selection the host restored) stays, so that filter can be cleared.
- **Stored settings are kept.** A grouping level on such a field still shows, under the field's name, so it can be removed, and nothing offers that field as a new choice. A hidden-field entry or a row-color rule on such a field is not shown, counted or cleared in the editors, and stays as stored: "Show all" and every other edit keep it.
- **Nothing else changes.** While the permission answer has not loaded, every list is as before, the same way the column check defers. A user who may read every field sees the same lists, in the same order.

**Clause-②: no**: no export, prop, type member or accepted input changes.
