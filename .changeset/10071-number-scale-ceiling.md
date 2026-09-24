---
'@object-ui/fields': patch
---

fix(fields): a declared `scale` above 100 no longer crashes the number cell or a grid's computed column (#10071)

`@objectstack/spec` 17.4.0 accepts a field `scale` above 100, but both
`Intl.NumberFormat` and `Number.prototype.toFixed` refuse more than 100 fraction
digits. `NumberCellRenderer` passed the declared `scale` straight into `Intl`,
so the cell threw `RangeError` at render; `computeRow` rounded a computed grid
column with `toFixed(scale)`, so editing a master-detail line threw out of the
edit. Both now take the ruling the percent faces already took (objectui#9808):
the width is clamped to 100 and a one-time `console.warn` names the declared
width, the rendered width and the card. In-range, negative and non-integer
widths are unchanged.
