---
'@object-ui/fields': patch
'@object-ui/components': patch
'@object-ui/types': patch
---

The grid's inline cell editor and the kanban required-fields dialog draw `date` and `datetime` fields with the platform date picker, the face record forms and the action dialogs already draw (objectui#12664). The native input took its placeholder and digit order from the machine's locale, not the console's.

- **Where it applies.** Everything that renders `FieldEditWidget`: the grid's inline cell editor and the kanban required-fields dialog. The record details inline editor routes `date` / `datetime` to `DateField` itself and keeps the native input. The list filters are objectui#12743.
- **A typed day is no longer lost in a grid cell.** The picker reads its text when its control loses focus. The data table now blurs the focused control inside an injected cell editor before Enter or a click outside commits, and it commits the last value the editor staged. Before, a typed day was dropped on both. Escape still discards. Editors that stage on every keystroke behave as before.
- **The value written is unchanged.** A `date` field writes `YYYY-MM-DD` and a `datetime` field writes an ISO instant, as the native inputs did.
- **The picker stays lazy.** `FieldEditWidget` loads it through the same `import()` the form uses, so it stays in its own chunk, and shows a placeholder with no input while it loads.
- **No public surface changes.** No type member, prop, export or language-pack key is added or removed. The `renderCellEditor` context keeps its seven members; its documentation now states the blur-before-commit behaviour.
