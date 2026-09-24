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
- bar / column / horizontal-bar / line / area / combo, when no row gives any bound series a
  value the axis can scale: every value boolean, `null` or an unparseable string. For a stacked
  series `null` counts as nothing too.

What keeps drawing, unchanged: numeric strings, `Date` values, range values `[lo, hi]` whose
two ends are both numbers (range bars and range areas), booleans in a STACKED series (the stack
reads them as numbers), a series that is all boolean beside a numeric one, and a dual-axis chart
with one live axis. `''` counts as a value at zero: a line, area or scatter draws it, and a bar,
horizontal-bar or combo paints the same zero-height picture as all-zero data, silently, exactly
as before. A bound series key that is not a plain property of any row (a dotted path such as
`a.b`, which Recharts resolves into nested rows, or a column no row carries) keeps the chart
silent: the refusal fires only when every bound key is read from the rows directly. Rows with no placeable pair still get scatter's
`no-plottable-points`, a multi-series scatter still gets `scatter-multi-series`, and
`missing-category-key` / `no-plottable-series` still take precedence over this one.
