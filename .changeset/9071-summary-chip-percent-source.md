---
'@object-ui/plugin-detail': patch
---

The `summaryFields` chip beside the record H1 reads the repo's percent authority
instead of a drifted copy of it (objectui#9071).

The chip scaled a stored `percent` by a rule of its own — a pass-through above 1,
a scale-by-100 at or below it — while `percentDisplayValue` in `@object-ui/core`,
the declared single source of truth that the list cell (`formatPercent` /
`PercentCellRenderer`), the dashboard measure (`formatMeasure`) and the grid
column summary all reach, uses the symmetric `value > -1 && value < 1`. The local
predicate is deleted, not realigned.

**Two values move, and only these two.** They are exactly where the two rules
disagreed:

- a stored `1` now reads `1%` beside a bar at 1%, where it read `100%` beside a
  full bar — one percentage point, the answer every other surface already gave;
- a stored value at or below `-1` is passed through: a stored `-5` now reads
  `-5%` where it read `-500%`. The bar is unchanged for these inputs, since any
  negative clamps to an empty track either way.

Everything inside the band the two rules always agreed on is byte-identical: a
stored `0.25` still reads `25%`, `0.123` still reads `12.3%`, `12.3` still reads
`12.3%`, `250` still reads `250%`, and the float-residue trim that keeps `0.07`
reading `7%` rather than `7.000000000000001%` is unchanged.

⚠️ **Dated note, 2026-10-02 — the magnitude guess is retired in this same release — objectui#11475.**
Later in this same release `percentDisplayValue` (`@object-ui/core`) stopped
inferring a percentage's storage from the value: it takes the storage as a
required argument, and every percent face passes the storage the field
declares (`percentScaleOf` in `@objectstack/spec/data`: a fraction unless the
field declares a `max` above 1). So the chip reads its field's storage: a stored `1` on a field that declares
no `max` reads `100%` beside a bar at 100%, a stored `1` on a field declaring
`max: 100` reads `1%`, and the rows above that read a value by its magnitude no
longer describe the chip. The rest of this entry is kept as the reading of this change.
