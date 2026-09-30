---
'@object-ui/fields': minor
---

The percent EDIT WIDGET reads `scale` for its fraction width, not `precision`
(objectui#9568).

`PercentField` took `precision` as the decimal-place count for three things at
once: the readonly face's `toFixed` width, the number input's `step` attribute
and the slider's step. `@objectstack/spec` declares the pair on the field face
in its own words — `precision` is "Total digits (non-negative integer)" and
`scale` is "Decimal places (non-negative integer)" — so a percent field carrying
an accurate `decimal(p, s)` pair was padded out to the column's TOTAL width. A
`decimal(10, 2)` percent field rendered `25.0000000000%` readonly and offered
`step="0.0000000001"` while editing, with a slider that moved in `1e-10`
increments. The step half is not cosmetic: it makes the control unusable for the
value it is declared to edit.

This is the correction `NumberField` beside it already carried for its own step,
and the one objectui#9295 made on the read-only cell, the grid summary footer
and the record summary chip. The edit widget is the face that did not move.

**Behaviour moves in two directions**, for percent fields that declare these
members:

- A percent field declaring `scale` now honours it, in all three places.
  Declaring `scale: 0` previously rendered `25.00%` and stepped by `0.01`; it
  now renders `25%` and steps by `1`.
- A percent field declaring `precision` no longer pads to it. Declaring
  `precision: 10` previously rendered `25.0000000000%` and stepped by `1e-10`;
  it now takes the width of a percent field that declares no `scale` (below).

**Migration.** Restate the intended fraction width as `scale`, the member the
contract has always declared for it. Metadata carrying an accurate
`decimal(p, s)` pair — both members, as a database column exposes them — needs no
change and simply stops being padded.

**A percent field that declares neither member.** This change left its width
alone: the widget kept its own two decimals while `PercentCellRenderer` spelled
the same absence as zero fraction digits, and objectui#9568 declined to settle
that disagreement as a side effect of moving the member that is read. It was
settled by its own ruling, in objectui#9843, released alongside this change: the
absent width is `@objectstack/spec`'s, read through `resolveFieldScale` on every
percent face, so the editor and the grid cell now agree for a field that
declares nothing. The whole-percent convention this widget detects from a
declared `max` above 1 is untouched.

`CurrencyField` is not part of this change: a currency's decimal places are the
currency's own ISO 4217 minor-unit count, and since objectui#10276 that widget
reads neither `precision` nor `scale` for them. `CurrencyConfigSchema.precision`
is a third surface again, with the opposite convention and its own `scale`
alias, and the spec warns against conflating it with the field face.
