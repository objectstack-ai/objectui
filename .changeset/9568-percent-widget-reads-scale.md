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
  it now falls to the widget's own two-decimal default.

**Migration.** Restate the intended fraction width as `scale`, the member the
contract has always declared for it. Metadata carrying an accurate
`decimal(p, s)` pair — both members, as a database column exposes them — needs no
change and simply stops being padded.

**Unchanged: a percent field that declares neither member.** The absent-`scale`
width stays this widget's own two decimals (`12.35%`, `step="0.01"`), so the
repair is invisible to metadata that declares nothing, and the whole-percent
convention this widget detects from a declared `max` above 1 is untouched.

⚠️ That default is deliberate and it is NOT the cell's: `PercentCellRenderer`
spells the same absence as zero fraction digits. The two faces therefore still
disagree for a field that declares nothing — `12%` in a grid cell against
`12.35%` in the editor — as they did before this change. objectui#9568 declines
to make widget-versus-cell agreement a premise, and closing that gap needs its
own ruling rather than arriving as a side effect of moving the member that is
read.

`CurrencyField`'s own read of `precision` is untouched and is not the same
shape: there the competing source is the currency's ISO 4217 minor-unit count,
and objectui#4361 ruled an authored `precision` wins over that. It ruled nothing
about `scale`. `CurrencyConfigSchema.precision` is a third surface again, with
the opposite convention and its own `scale` alias, and the spec warns against
conflating it with the field face.
