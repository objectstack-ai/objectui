---
'@object-ui/plugin-dashboard': patch
---

`object-data-table` no longer draws an untyped column as text while the object definition is loading or after its read failed: it draws the mask instead (objectui#10657, the objectui#10706 class at this producer).

A cell here draws from the column's authored `type`, or the object's. Bound and inline
rows are drawn before the object definition arrives, and a failed read never delivers
one, so in that window a column that authors no `type` drew its value as text, a
`password` / `secret` field included. objectui#10657's first change already set
`TableColumn.masked` on every column in that window, but the flag withholds; it does not
draw.

Now, in that window, a column with no `type` of its own is drawn as the mask
(`MaskedCellRenderer` from `@object-ui/fields`), declared and derived columns alike, and
stays so when the read failed: fail closed, never back to text. A column that authors its
`type` draws from it, and a column with a `cell` of its own draws what that `cell`
returns. Once the definition lands, each column draws from its declared type as before.

The record drawer a row opens (record drill-down) drew the clicked record's fields from
the same unknown types, so after a failed read it printed a `password` / `secret` field
as text too. In that window it now draws every value as the mask.

The pending objectui#10657 `object-data-table` changeset says a `password` / `secret`
field is still drawn as text in that window; that no longer holds once this change ships
with it.

This is defence in depth. The real guard is still the server: ObjectStack's read mask
replaces `secret` and `password` values with its mask before they reach the browser.
