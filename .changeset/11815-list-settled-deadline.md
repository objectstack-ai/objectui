---
'@object-ui/plugin-list': minor
---

Gallery cards and the compact list honour a deadline's `settledWhen` (objectui#11815): a done record's past due date reads neutral, an open one's reads "Overdue Nd" in red. Gallery cards now also read the field's declared `dueLike`, so a declared deadline reads overdue there at all.
