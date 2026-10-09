---
'@object-ui/app-shell': patch
---

The flow designer saves a screen field's `Min` and `Max` as numbers (objectui#11664).

A screen node's `fields` list is edited as a table, one row per field. The screen descriptor's `configSchema` declares `min` and `max` as `type: 'number'`, but the table had no number column, so it rendered them as text cells. Authoring `Min` = 1 saved `min: '1'`, and the text cell read a code-authored field's stored `min: 0` back as `'0'`. The screen contract (`ScreenFieldConfigSchema.min` / `.max` are `z.number()`) refuses strings, so every run of such a flow failed at the screen node.

- **A number or integer item property is now a number column**, the same mapping the designer already used for a node's top-level number fields. Its cell is a number input.
- **A number column commits a number.** A typed `0` is saved as `0`. Clearing the cell removes the key; it does not save `''`, `null` or `NaN`. An entry the browser cannot read as a number saves nothing, as in the top-level number field.
- **A stored number stays a number** when another cell of its row is edited.
- **Editing a code-authored field no longer drops its other settings.** The designer shows its built-in screen form until the server's `configSchema` arrives, then the server's form. Rows read while the built-in form was showing had no `Min` or `Max` cell, so the next edit saved the field without its `min` and `max`, and without its `options`, `defaultValue`, `placeholder`, `inlineHelpText` and `reference`. A row now reads a column that appears later from the stored field. Nothing is saved until the author edits.
- **Stored strings are not converted.** A string already stored in a number column (as the old text cell saved it) is kept exactly as it is until the author types over it, and the screen contract still refuses it. Strings in other columns are unchanged.

This applies to every object-list column the engine publishes with a number or integer type, not only the screen's `min` and `max`. The designer's built-in screen form, used when the server publishes no `configSchema`, has no `Min` or `Max` column and is unchanged.

**Clause-②: no.** Nothing on the package entry changes. The new `number` column kind is on `FlowConfigColumn`, in the inspector's own module, which `@object-ui/app-shell` does not export. The object-list row changes are internal to that module.
