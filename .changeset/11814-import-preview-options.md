---
'@object-ui/plugin-grid': patch
---

Import wizard preview: an unknown picklist value is marked like a bad number, the preview's findings and the server's dry-run findings read as one list per row, and the import button counts only the rows nothing was found on (objectui#11814).

- **Picklist values are checked in the preview.** A `select`, `radio`, `multiselect`, `checkboxes` or `tags` cell is checked against the field's options the way the server's import does: an option value matches exactly, an option label matches ignoring case, and a multi-option cell is split on `,` `;` `、` and newlines. A field with no options takes anything. *Keep unknown option values* does not spare a writable field, because the server still refuses the value when it writes the row. It spares a match-only field, which the server checks for shape only.
- **One findings list.** Each row with a finding is listed once, with every finding on it: the preview's own, and, after *Validate data*, the server's. A server finding on a field the preview already flagged in that row is not listed twice. A server finding also marks its cell in the preview.
- **The import button counts importable rows.** "Import 2 Rows" with one row known to fail now reads "Import 1 Row". The "rows with errors" note counts every row of the file, not only the ten previewed.
- **The preview no longer marks what the server takes.** A formatted number (`1,234`, `$12`, `25%`, `(1,234)`) is read the way the server reads it. `0x10`, `Infinity` and `12.` are now marked, as the server refuses them. A whitespace-only cell is blank. A required field's blank cell is marked only when the import creates records. Columns a named server mapping transforms are not checked.

Nothing is added to the package entry: no export, prop, type member or language-pack key. Every message reuses an existing `grid.import.*` string.
