---
'@object-ui/plugin-detail': patch
---

`RelatedList` sets `TableColumn.masked` on the columns it hands its table, so a `password` / `secret` column no longer copies, shows or sorts by its raw value (objectui#10657).

The related list draws a `password` / `secret` cell as `••••••`, but it never set the flag
the table reads. So the table handed the raw value out anyway: Ctrl+C / Cmd+C on the masked
cell copied the credential, the cell's tooltip carried it, a click on its header sorted the
list by it (the table's headers drive this list's own sort), and the column's width grew
with it.

The list now sets the flag on every column whose cell is drawn as a mask, from
`isMaskedFieldType()` in `@object-ui/fields` over the column's authored `type` and the
object's field type (a narrow-only union: a column authored as `text` over a `secret`
field keeps the flag). It applies to authored columns, bare field names and the columns
the list derives on its own.

It fails closed. While the object definition is still loading, or after its read failed,
the list cannot tell a masked column from any other, so it sets the flag on every column:
in that window no cell copies or shows a tooltip, and no header sorts. Not covered: in the
same window a field the object declares as `password` / `secret` is drawn as text,
because the mask comes from that declaration.

Also not covered: the list's own filter box (opt-in `filterable`) matches against every
field of a row, and its sort buttons (`type: 'list'` with `sortable`) sort by any column,
masked ones included.

This is defence in depth. The real guard is still the server: ObjectStack's read mask
replaces `secret` and `password` values with its mask before they reach the browser.
