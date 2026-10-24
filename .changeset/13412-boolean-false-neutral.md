---
'@object-ui/fields': patch
---

A boolean renders the same whatever its name (objectui#13412). `BooleanCellRenderer` drew a red destructive "LABEL — Off" badge for `false` when the field was named `active`, `is_active`, `enabled`, `is_enabled`, `verified` or `is_verified`, so a plain `Field.boolean` named `verified` read as an error on every new record, in lists and on the record page. Those names now draw the same unchecked checkbox as any other boolean, named by the field's label, and `true` still draws the checked box. The completion indicator for `completed`, `is_completed`, `done` and `is_done` is unchanged.
