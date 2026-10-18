---
'@object-ui/plugin-detail': minor
---

The record page and related lists honour a deadline's `settledWhen` (objectui#11815). The details section, the highlights strip and each related-list row judge a declared deadline against their own record, so a done record's past due date reads neutral while an open one reads "Overdue Nd" in red. A related list asks for the fields the predicate reads when no column shows them. The deadline comes from the object field only: a `dueLike` written on a detail-view entry is ignored.
