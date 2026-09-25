---
'@object-ui/plugin-charts': patch
---

A cartesian chart whose numeric axis has rows but nothing to build a scale from now says so
instead of drawing an empty frame (objectui#7195). The tile renders the existing
`data-chart-error` placeholder with the new code `no-numeric-value` and a sentence naming the
bound key and the row count: "none of the N rows has a numeric value for KEY".

The answer is keyed on the whole dataset, not on the value's type. A boolean beside one real
number still draws (Recharts builds the scale from the number and places the booleans on it), so
that mixed chart keeps drawing with no note. What now refuses, each of which drew zero marks
before:

- scatter, when every row's x (or y, or both) is a boolean, or a boolean mixed only with values
  that cannot be placed. That last shape used to carry a footnote implying one point was drawn;
- bar / column / horizontal-bar / line / area / combo with no stacked bar or area series, when
  no row gives any bound series a value the axis can scale: every value boolean, `null` or an
  unparseable string. A line's `stack` has no effect in the renderer, so a "stacked" line is
  judged the same way.

A chart with ANY stacked bar or stacked area series is never refused, whatever its values: the
stack gives its axis a scale on its own, and every series on that axis is placed on it (an
all-boolean series beside a stacked all-`null` one draws). Some of those charts draw nothing
(a stacked all-`null` bar, a stacked area of unparseable strings); they stay silent, exactly as
before, rather than risk a sentence over marks that are on screen.

What keeps drawing, unchanged: numeric strings, `Number` objects, `Date` values, range values
(an array read by its first two elements, both numbers, so `[1, 3]` and `[1, 2, 3]` alike: range
bars and range areas), every chart with a STACKED bar or area series (the stack paints booleans
as numbers, and unparseable strings, `NaN`, objects and arrays as full-height bars), a series that
is all boolean beside a numeric one, a dual-axis chart with one live axis, and any axis whose
spec declares both a numeric `min` and a numeric `max` (the chart builds that scale from the spec
and places booleans on it), and any axis whose spec declares a `stepSize` (with one declared
bound, the chart's tick builder reads booleans as 0 and 1 and supplies the other end; a `stepSize`
alone is left silent too, erring toward silence). A `min` or `max` alone, `logarithmic` alone
or an annotation does not build a scale, so those tiles are still refused. `''` counts as a value at zero: a line, area or scatter draws it, and a bar,
horizontal-bar or combo paints the same zero-height picture as all-zero data, silently, exactly
as before. A bound series key that is not a plain property of any row (a dotted path such as
`a.b`, which Recharts resolves into nested rows, or a column no row carries) keeps the chart
silent: the refusal fires only when every bound key is read from the rows directly. Rows with no placeable pair still get scatter's
`no-plottable-points`, a multi-series scatter still gets `scatter-multi-series`, and
`missing-category-key` / `no-plottable-series` still take precedence over this one.
