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

⚠️ **Dated note, 2026-09-29 — the clamp above was retired in this same release — objectui#11073.**
Later in this release this repository began resolving `@objectstack/spec` 17.5.0, which refuses a field `scale` above 100 at the declaration (`too_big` at `scale`, a computed number field included). The objectui#9808 ruling this change followed retires at exactly that point, so the clamp and its one-time warning are gone from `NumberCellRenderer` and from a grid's computed column: the declared width is passed through again, and a width above 100 is no longer something an author can declare.
