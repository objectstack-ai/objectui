---
'@object-ui/fields': minor
'@object-ui/plugin-grid': minor
---

Both percent surfaces read `scale` for their fraction width, not `precision`
(objectui#9295).

`PercentCellRenderer` in `@object-ui/fields` and the `colType === 'percent'` arm
of `formatSummaryLabel` in `@object-ui/plugin-grid`'s `useColumnSummary` each
took `precision` and handed it to `Intl` as BOTH the minimum and the maximum
fraction digits. `@objectstack/spec` declares the pair in its own words on both
the field face and the column face: `precision` is the "Total digits" of a
`decimal(p, s)` column and `scale` is its "Decimal places" — so a percent field
was padded out to the column's TOTAL width. A `decimal(10, 2)` percent field
rendered `25.0000000000%` in the cell and `Sum: 25.0000000000%` in the footer
directly beneath it. This is the identical defect objectui#2131 removed from the
currency arm and objectui#2134 from the number arm, arriving one type later; in
`useColumnSummary` the corrected percent arm now sits four lines below a currency
arm it finally agrees with.

**Breaking, deliberately — filed as `minor` because this repo's fixed release
group forbids `major`.** Percent rendering moves in two directions:

- A percent field or column declaring `scale` now honours it. Declaring
  `scale: 2` previously rendered `25%` and now renders `25.00%`.
- A percent field or column declaring `precision` no longer pads to it.
  Declaring `precision: 10` previously rendered `25.0000000000%` and now
  renders `25%`.

**Migration.** Restate the intended fraction width as `scale`, which is the
member the contract has always declared for it. Metadata carrying an accurate
`decimal(p, s)` pair — both members, as a database column exposes them — needs no
change and simply stops being padded.

**Unchanged: a percent field that declares neither member.** An absent `scale`
is still zero fraction digits, matching the currency arm beside it, so this is
invisible to metadata that declares nothing. That default is a decision rather
than a leftover: the number cell renderer spells the same absence as
`undefined` (minimum 0, maximum 20), and copying it here would print binary
floating-point residue, because the percent path multiplies by 100 first and
`Intl` renders from the shortest decimal representation of the resulting double
— a stored `0.07` becomes `7.000000000000001` and `0.29` becomes
`28.999999999999996`. The number arm can afford an unbounded maximum because it
performs no arithmetic on the value.

`CurrencyConfigSchema.precision` is untouched and must not be conflated with
this: it is a different surface with the opposite convention and its own
`scale` alias, and the spec says so at the field-face declaration.
