---
'@object-ui/plugin-detail': patch
---

A date field on the record page stops drawing "Overdue Nd" in red when the record has settled its deadline (objectui#12726). The record page evaluates the object field's `settledWhen` (`@objectstack/spec`) against the record it shows, as the grid does. When the predicate holds, the cell gets `dueLike: false` and draws the neutral relative date. A field without `settledWhen`, a record where it does not hold, and a date that is not a deadline all render as before. The stage option's `kind` settles nothing by itself.

Clause-②: no
