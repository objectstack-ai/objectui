---
'@object-ui/plugin-form': patch
'@object-ui/components': patch
---

A sectioned create or edit form draws every section at its own `columns` count per row, whatever the other sections declare (objectui#12548).

`@objectstack/spec` `FormSectionSchema.columns` is a per-section count, but all of a form's sections share one field grid, sized by the widest section, and each field spanned `Math.round(grid / sectionColumns)` cells of it. A section whose count did not fit that grid drew the wrong number per row. A `columns: 2` section beside a `columns: 3` one spanned 2 of 3 cells, so it drew one field per row and left the right third empty. A `columns: 3` section beside a `columns: 4` one spanned 1 of 4 cells, so it drew four per row.

`ModalForm`, `ObjectForm`, `SplitForm`, `TabbedForm` and `WizardForm` now share one rule:

- When every section's count is 1 or the grid's own width, the form keeps the grid and spans it always had, class for class.
- Otherwise the field grid is 12 tracks wide from `@md` (`grid-cols-1 @md:grid-cols-12`). Each field spans 12 / 6 / 4 / 3 twelfths of the row for a 1 / 2 / 3 / 4-column section. `span: 'full'` and wide widgets take the row, and an authored `colSpan` counts its section's columns.

The form renderer draws a twelfths `colSpan` with the step ladder each count has on its own grid: at most two per row at `@md`, three at `@2xl` and four at `@4xl`. Below `@md` the form stays one column.

No type, prop or export changes. A form with no section `columns` is unchanged.
