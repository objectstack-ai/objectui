---
'@object-ui/plugin-detail': patch
---

The related list no longer draws a cell as text while its object definition is loading or after its read failed: it draws the mask instead (objectui#10657, the objectui#10706 class at this producer).

The list draws a cell from the object's field type, never from a column's authored
`type`. While the definition was in flight, and for good after its read failed, no column
had a cell, so the table drew every value as text, a `password` / `secret` field
included. objectui#10657's first change already set `TableColumn.masked` on every column
in that window (no copy, tooltip or header sort), but the flag withholds; it does not
draw.

Now, in that window, every column without a `cell` of its own is drawn as the mask
(`MaskedCellRenderer` from `@object-ui/fields`), and stays so when the read failed: fail
closed, never back to text. A column whose `cell` the author supplied draws what that
`cell` returns. Once the definition lands, each column draws from its declared type as
before.

The cost: while the definition is loading, and for good after a failed read, the list
shows masks where it used to show values. The pending objectui#10657 related-list
changeset says a `password` / `secret` field is still drawn as text in that window; that
no longer holds once this change ships with it.

This is defence in depth. The real guard is still the server: ObjectStack's read mask
replaces `secret` and `password` values with its mask before they reach the browser.
