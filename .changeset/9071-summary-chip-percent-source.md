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
