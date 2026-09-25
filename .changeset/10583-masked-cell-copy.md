---
'@object-ui/types': minor
'@object-ui/components': patch
'@object-ui/plugin-grid': patch
---

A masked grid cell no longer hands its raw value out (objectui#10583).

`@object-ui/fields` draws `password` and `secret` cells as `••••••`. In `object-grid` the
cell drew the mask, but `data-table`'s Ctrl+C / Cmd+C handler copied
`String(row[accessorKey])` for every focused cell, so the keyboard wrote the **raw**
credential to the clipboard, silently. The same cell also carried the raw value as its
`title` tooltip, so a hover showed it and the DOM held it. This is the grid face of the
disclosure the detail page closed in objectui#8440.

- **`@object-ui/types`: new declared key `TableColumn.masked?: boolean`**, mirrored as a
  typed `z.boolean()` on `TableColumnSchema` and refused on the static `table` column
  (`StaticTableColumn`), like the other rich-only keys. Additive.
- **`@object-ui/components`: `data-table` obeys the flag.** On a `masked` column,
  Ctrl+C / Cmd+C writes nothing to the clipboard (and still prevents the browser's own
  copy, which would put a selected mask on the clipboard as bullets), the cell has no
  `title` tooltip, and the built-in CSV export leaves the column out. It is left out, not
  blanked: a column of empty strings would claim the records hold nothing. The flag
  withholds; it does not draw. The mask comes from the column's `cell` renderer. Columns
  without the flag copy, show and export exactly as before.
- **`@object-ui/plugin-grid`: `ObjectGrid` sets the flag** at its column emit seam, from
  `isMaskedFieldType()` (objectui#8686). It reads the column's type and the
  object-declared type as a narrow-only union, the same shape as the detail page's
  `isMaskedDetailFieldType`. So a view that authors `type: 'text'` over a `secret` field
  keeps the refusal. Unmasked columns reach the table unchanged.
