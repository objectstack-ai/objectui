---
'@object-ui/plugin-list': patch
---

An ungrouped list view now asks for the object's declared `nameField` in its `$select`, so the bulk confirm step lists each record's name rather than `Record #ID` when no column shows that field. The field is fetched, not drawn, and goes through the same known-field and field-permission gates as the list's other harvested fields.
