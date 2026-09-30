---
'@object-ui/fields': patch
'@object-ui/plugin-detail': patch
'@object-ui/plugin-grid': patch
---

fix(fields,plugin-detail,plugin-grid): every percent face reads its width through the spec's `resolveFieldScale`, so an undeclared percent renders the same everywhere

A `percent` field that declares no `scale` used to render two widths for one
stored value: the list cell, the record header's summary chip and the grid
column-summary footer each spelled their own `?? 0`, while the `PercentField`
edit widget kept its own `2` — so a stored `0.25` read `25%` in the list and
`25.00%` in the widget.

All four faces now ask `resolveFieldScale` from `@objectstack/spec/data`, the
protocol's single answer for what an absent `scale` means per field type. An
undeclared percent therefore reads the same width on every face, and a declared
`scale` reads as declared everywhere, as before.

What moves for users:

- **`PercentField`** — an undeclared percent's readonly face shows the
  protocol's width (`25%`, not `25.00%`), and the input and slider step by that
  width too, as a declared `scale: 0` always has: whole percents. A stored
  fractional value still shows in full and saves untouched; typing an off-step
  value and pressing Enter while the box has focus is refused by the browser's
  own step validation, as it already was for a declared width.
- **Grid column-summary footer, `number` columns** — a declared `scale` is now a
  fixed width (`Sum: 1.50`). With none declared the column has no fixed width,
  and a computed result is rounded to the widest decimal count among the values
  it was computed from, instead of this footer's own two (`avg`) or three
  decimals: an average of `1`, `2`, `2` reads `Avg: 2`, and a `min` over
  `1.2345` reads `1.2345`. Columns with no `type` are unchanged.
- A malformed `scale` (a string from stored JSON) is treated as no declaration
  on every face.

`@object-ui/fields`, `@object-ui/plugin-detail` and `@object-ui/plugin-grid`
raise their `@objectstack/spec` floor to `^17.5.0`, the first release that
exports `resolveFieldScale`.
