---
'@object-ui/plugin-list': patch
'@object-ui/plugin-grid': patch
---

A list view draws a `referenceVia` pointer column's record when its columns do not show the type half (objectui#13036).

A pointer column (objectui#12608) resolves its record from the row: it reads the sibling field the column's `referenceVia` names. A list's `$select` asked for the shown columns and its other harvested fields, but never for that sibling, so a list showing `record_id` without `object_name` drew the raw record id. Both projection builders now ask for the sibling of every shown pointer column: `ListView`'s own fetch and the fetch a grid makes for itself, grouped or not. A sibling the viewer may not read, or one the object does not declare, is not asked for; such a row keeps the stored text, as a row whose sibling is blank does.

Nothing is added to the package entry: no export, prop or type member.
