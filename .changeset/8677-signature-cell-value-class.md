---
'@object-ui/fields': patch
---

A `signature` cell holding `{}` now prints `[Object]`, as every other member of its
value class does, instead of the "No value" affordance (objectui#8677).

`@objectstack/spec` places `signature` in `STRING_VALUE_TYPES` ("Value is a plain
string" — the stored value is a data-URI PNG), not in the file-reference class with
`image` and `avatar`. objectui#8580 ruled the cell output of that class's empty-shaped
values and objectui#8596 applied it to the rest of the class: `[]`, `''` and `null`
draw the shared affordance, and `{}` prints the coerced text exactly as `text` prints
it, because the record is storing something. `signature` was registered straight to
`ImageCellRenderer`, whose answer for a value with nothing to draw is the media rule —
"No value" — so it was the one member of the class still drawing the affordance for
`{}`.

`getCellRenderer('signature')` now resolves to a signature cell with two arms. A value
the image cell can draw — the stored data-URI string, and the URL and file-reference
shapes it already resolved — renders exactly as before, byte-equal to what `image`
draws. Anything else is read the way the string class reads it: `[]`, `''` and `null`
still draw the affordance (the same bytes as before), and `{}` prints `[Object]`. An
object the image cell cannot draw but that carries a display name now prints that
name, and a stray number prints as text, both as `text` prints them.

`image` and `avatar` are unchanged: they are file references, and "No value" is their
correct answer to `{}`. No export was added or removed.
