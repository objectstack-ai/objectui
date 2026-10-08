---
'@object-ui/components': patch
'@object-ui/plugin-list': patch
---

Grid inline edit marks a row modified only when a value really changed, draws one "Actions" column, and the "Edit inline" toggle reports its state (objectui#11816).

- **A row is modified only by a real change.** The data table staged every committed cell edit, so clicking into a cell and out again showed "1 row modified · Cancel All · Save All (1)" for a row nobody had changed. An edit is now staged only when the value differs from the one the row loaded with. `null`, `undefined`, `''` and `[]` count as the same empty value, a number equals the decimal string that spells it (`5` and `'5'`), and a multi-value set equals the same set in another order. Staging the loaded value back removes the cell's edit, and the row is no longer counted as modified once none of its cells are.
- **One "Actions" column.** With inline edit on, the trailing column that only holds a modified row's cancel and save buttons was headed "Actions" too, beside the grid's own row-menu column, and in larger type. When that column can only hold those buttons (the table is editable, has a save handler, and is given no row-menu handler), its header is now a pencil icon with the accessible name "Edit" (the existing `table.edit` key). A column that can hold a row menu keeps the "Actions" header, now in the same small muted type as the other column headers.
- **The "Edit inline" toolbar toggle sets `aria-pressed`** to whether inline edit is on.

No export, prop, type member or language-pack key is added.
