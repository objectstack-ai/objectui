---
'@object-ui/types': minor
'@object-ui/components': patch
'@object-ui/plugin-grid': patch
---

Once the grid has its object schema, a masked grid field's raw value is withheld from copy, tooltip, inline edit, the client export and the mobile card, and a masked field is refused as a grouping key (objectui#10583).

`@object-ui/fields` draws `password` and `secret` cells as `••••••`. In `object-grid` the
cell drew the mask, but the raw value still left through other paths:

- `data-table`'s Ctrl+C / Cmd+C handler copied `String(row[accessorKey])` for every
  focused cell.
- The cell's `title` tooltip carried the raw value, so a hover showed it and the DOM
  held it.
- Inline edit, for a view-typed password column, seeded its editor with the raw value.
- The grid's client export wrote it: the CSV per column, the JSON as whole records.
- The mobile card printed the first column, and fields named like an amount or a
  stage, raw.
- Grouping by a masked field printed its raw value as each group's label.

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
  `isMaskedFieldType()` (objectui#8686). It reads the column's type and, once the object
  schema has loaded, the object-declared type as a narrow-only union, the same shape as
  the detail page's `isMaskedDetailFieldType`. So a view that authors `type: 'password'`
  masks a field the object declares as text from first paint, and a view that authors
  `type: 'text'` over a `secret` field keeps the refusal once the schema has loaded. Once the object schema has loaded, the same rule leaves every masked
  field of the grid's object out of the grid's client export (CSV and JSON, used when the
  data source has no server export) and draws a masked field through its cell on the
  mobile card. Once the object schema has loaded, it also refuses a masked field as a
  grouping key: the entry is ignored, the other grouping levels
  still apply, and a console warning names the field. Masking the group label was not
  enough, because the groups would still show which records share a credential, in its
  raw order. Unmasked columns, files and groupings are unchanged.

**Not covered.**

- The flag withholds; it does not draw. The mask comes from the producer's `cell`
  renderer, and `data-table` draws a column with no `cell` as its value.
- The table's client-side search and sort still run over the raw values
  (objectui#10657, which folded objectui#10658).
- A masked column's width is still sized from the raw value's length (objectui#10657,
  which folded objectui#10658).
- On the host-fetched path (rows handed down as `data`, as `ListView` and `ObjectView`
  do), the grid's guards and the cell's own mask depend on the object schema, which the
  grid fetches after first paint. Until it arrives, and for good if that read fails (the
  grid swallows the failure and keeps its heuristic column types), an untyped view column
  over a `password` / `secret` field draws and hands out the raw value (objectui#10657, which folded objectui#10706).
- The server-streamed export (`exportDownload`) sends the masked columns as before and
  relies on the server's masking.
- The client JSON export writes an expanded lookup record whole, so a credential field
  of the related object is not pruned. The same holds for the table's CSV export of a
  lookup column.
- The related list and `object-data-table` produce `data-table` columns too, and they do
  not set the flag yet (objectui#10657).
