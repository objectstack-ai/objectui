---
'@object-ui/plugin-dashboard': patch
---

`object-data-table` sets `TableColumn.masked` on its columns, so a `password` / `secret` column no longer copies, exports, searches, sorts or sizes by its raw value (objectui#10657, which folded objectui#10658).

The dashboard table widget draws a `password` / `secret` cell as `••••••`, but it never set
the flag the table reads. So the table handed the raw value out anyway: Ctrl+C / Cmd+C on
the masked cell, its tooltip, the CSV export, the search box (which runs in the browser
here) and the header sort all read it, and the column's width grew with it.

The widget now sets the flag on every column whose cell is drawn as a mask, from
`isMaskedFieldType()` in `@object-ui/fields` over the column's authored `type` and the
object's field type (a narrow-only union: a column authored as `text` over a `secret`
field keeps the flag), for declared and derived columns alike.

It fails closed. Bound and inline rows are drawn before the object definition arrives, and
a failed read never delivers one. In that window the widget cannot tell a masked column
from any other, so it sets the flag on every column: no cell copies, shows a tooltip or is
exported, the search matches nothing, no header sorts, and widths come from the headers.
Not covered: in the same window a field the object declares as `password` / `secret` is
drawn as text, because the mask comes from that declaration.

This is defence in depth. The real guard is still the server: ObjectStack's read mask
replaces `secret` and `password` values with its mask before they reach the browser.
