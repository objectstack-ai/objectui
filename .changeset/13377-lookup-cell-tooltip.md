---
'@object-ui/types': minor
'@object-ui/components': patch
'@object-ui/plugin-grid': patch
---

Grids: hovering a `lookup` or `master_detail` cell no longer shows the referenced record's raw id (objectui#13377).

The table's cell wrapper set its `title` tooltip to the cell's raw value, and for a reference column that value is the related record's id. So hovering beside the drawn name, or beside "Restricted record" for a record the viewer cannot read, still showed the id.

- **`@object-ui/types`:** `TableColumn` gains an optional `foreignKey` boolean: the column's raw value is the id of a referenced record. The zod mirror (`TableColumnSchema`) keeps it, and the static `table` column refuses it by name, like `masked` and `chips`.
- **`@object-ui/components`:** a `data-table` column with `foreignKey: true` draws no `title` tooltip. Nothing else changes for it: copy, CSV export, inline edit, search and sort behave as before.
- **`@object-ui/plugin-grid`:** `ObjectGrid` sets `foreignKey` on every `lookup`, `master_detail`, `tree` and `user` column, read from the column's own type or the object's field type. Every other column keeps its tooltip.
