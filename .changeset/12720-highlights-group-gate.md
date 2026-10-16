---
'@object-ui/plugin-detail': patch
---

The derived highlight strip on a record page no longer picks a field from a field group that declares a `visibleWhen` (objectui#12720).

When an object declares no `highlightFields`, the record page picks its header chips heuristically, and that pick never read `fieldGroups`. A member of a gated group could therefore become a chip with its value on a record where the details body hides the whole group. The heuristic now skips every member of a group whose `visibleWhen` the details body evaluates, on every record: it runs from object metadata with no record in hand, so it does not evaluate the predicate, and the details body stays the one place that does. Where the group is shown, its members are drawn in the body, once, as before. The record preview card's key fields come from the same heuristic and skip those members too. A declared `highlightFields` list is unchanged, including an entry inside a gated group.

Clause-②: no
