---
'@object-ui/types': minor
'@object-ui/components': patch
'@object-ui/plugin-grid': patch
---

A masked grid field's raw value is withheld from copy, tooltip, inline edit, export and the mobile card title (objectui#10583).

`@object-ui/fields` draws `password` and `secret` cells as `••••••`. In `object-grid` the
cell drew the mask, but the raw value still left through other paths:

- `data-table`'s Ctrl+C / Cmd+C handler copied `String(row[accessorKey])` for every
  focused cell.
- The cell's `title` tooltip carried the raw value, so a hover showed it and the DOM
  held it.
- Inline edit seeded its editor with the raw value.
- The grid's client export wrote it: the CSV per column, the JSON as whole records.
- The mobile card printed the first column, and fields named like an amount or a
  stage, raw.

This is the grid face of the disclosure the detail page closed in objectui#8440.

- **`@object-ui/types`: new declared key `TableColumn.masked?: boolean`**, mirrored as a
  typed `z.boolean()` on `TableColumnSchema` and refused on the static `table` column
  (`StaticTableColumn`), like the other rich-only keys. Additive.
- **`@object-ui/components`: `data-table` obeys the flag on four paths.** On a `masked`
  column:
  - Ctrl+C / Cmd+C writes nothing to the clipboard. It still blocks the browser's own
    copy, which would put a selected mask on the clipboard as bullets.
  - The cell has no `title` tooltip.
  - The built-in CSV export leaves the column out. It is left out, not blanked: a
    column of empty strings would claim the records hold nothing.
  - The column never enters inline edit, by Enter, click or double-click, and its cell
    no longer takes the row's click as an edit.

  Columns without the flag copy, show, export and edit exactly as before.
- **`@object-ui/plugin-grid`: `ObjectGrid` sets the flag** at its column emit seam, from
  `isMaskedFieldType()` (objectui#8686). It reads the column's type and the
  object-declared type as a narrow-only union, the same shape as the detail page's
  `isMaskedDetailFieldType`. So a view that authors `type: 'text'` over a `secret` field
  keeps the refusal, and a view that authors `type: 'password'` masks a field the object
  declares as text. The same rule leaves every masked field out of the grid's client
  export (CSV and JSON, used when the data source has no server export) and draws a
  masked field through its cell on the mobile card. Unmasked columns and files are
  unchanged.

**Not covered.** The flag withholds; it does not draw. The mask comes from the
producer's `cell` renderer, and `data-table` draws a column with no `cell` as its
value. The table's client-side search and sort still run over the raw values. The
related list and `object-data-table` produce `data-table` columns too, and they do not
set the flag yet.
