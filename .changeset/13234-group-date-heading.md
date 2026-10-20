---
'@object-ui/plugin-grid': patch
---

A grid grouped by a `date` or `datetime` field heads each group with the value drawn the way the field's cell draws it, not with the stored string (objectui#13234).

Grouped by a `date` field, the headings read `2026-10-01`, `2026-09-01`, `2026-08-01` while the cell of a row under them read "Oct 1". Select and boolean headings already read their labels; every other type fell back to the stored key. A `date` or `datetime` heading now reads exactly what its cell reads, in the display locale and through the field's declared `format`: "3 days ago" or "Oct 1" by default for a `date`, the compact "10/1/2026 9:30 am" for a `datetime`. A heading names the day, not one row's deadline, so a `dueLike` field's heading reads the neutral phrase ("3 days ago"), not "Overdue 3d". An empty key keeps its "(empty)" heading, and a key that is not a date keeps its stored text.

The groups keep the order and the counts of their stored keys: the grid still orders date groups by the stored value, so they stay in calendar order.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
