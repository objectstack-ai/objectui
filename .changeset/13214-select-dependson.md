---
'@object-ui/plugin-grid': patch
'@object-ui/plugin-list': patch
---

A list view fetches a shown column's declared `dependsOn` siblings, so a faced column can read them off the row (objectui#13214).

A faced column reads its siblings from the row it draws: the `recipient-picker` face names a stored id by the row's `recipient_type`. A list's `$select` asked for the shown columns and its other harvested fields, but never for those siblings, so a list showing `recipient_id` without `recipient_type` drew the raw user id. Both projection builders now ask for every sibling a shown column's field names in `dependsOn`: `ListView`'s own fetch and the fetch a grid makes for itself, grouped or not. A column authored `hidden: true` pulls nothing; a sibling the viewer may not read, or one the object does not declare, is not asked for. Nothing is added to the view's columns.

Nothing is added to the package entry: no export, prop or type member.
