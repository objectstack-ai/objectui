---
'@object-ui/plugin-detail': patch
---

`record:details` no longer draws a record pointer's type half as its own row (objectui#13102).

An object can declare a polymorphic record pointer as a pair: the id half (for example `record_id`) names its sibling with `referenceVia` (for example `object_name`), and the sibling holds the target object's machine name. The Details body draws the id half as the record card, which names the target object by its label. The type half also drew as a row of its own, so the page showed the stored machine name next to the label that names the same object. This affected the record pages of objects such as `sys_record_share`, `sys_share_link`, `sys_audit_log` and the approval objects.

The type half now leaves the body when its id half is drawn in the same body. The pair is read from the object's declared fields only, never from a field's name. A type half whose id half the body does not draw keeps its row. The record still carries the value, so the card still resolves the pair. An object that declares no pair draws exactly what it drew before.

Nothing is added to the package entry: no export, prop or key.
