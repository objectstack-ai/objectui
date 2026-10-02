---
'@object-ui/fields': patch
'@object-ui/plugin-dashboard': patch
---

fix(fields): a read-only percent or currency field shows its value the way its table cell does, and a whole currency amount keeps its minor units (objectui#11444)

A read-only `PercentField` printed the percentage with a literal `%` and no display
locale. A field declaring `scale: 2` and holding `0.25` read `25.00%` in a German
read-only form while its table cell read `25,00 %`, and a four-digit percentage lost
its grouping (`1234.5%` against the cell's `1,234.5%`). The read-only face now renders
through the same call the cell's `formatPercent` uses, so the locale's percent
convention, its grouping and the declared width match. The width is still the one
`resolveFieldScale` answers, and the face still reads a value as a fraction unless the
field declares `max > 1`.

A read-only `CurrencyField` and `CurrencyCellRenderer` disagreed on a whole amount: the
form read `$3,456.00` while the cell read `$3,456`. Triage ruled that the declared
width, a currency's ISO 4217 minor-unit count, is the protocol's convention, and retired
the whole-amount trimming `formatCurrency` applied since objectui#4033 (objectui#11444,
comment 5946462862). The read-only face now calls `formatCurrency` itself.

**Visible change in table cells.** `formatCurrency` no longer drops the fraction of a
whole amount. Every face that formats through it moves with it: the currency table
cell, the record detail panel, the grid column-summary footer, the dashboard metric
tile and table widget, and the gantt tooltip. A whole USD amount reads `$3,456.00`
instead of `$3,456`, a whole KWD amount `KWD 3,456.000` instead of `KWD 3,456`, and an
amount with no currency resolved `3,456.00` instead of `3,456`. A currency with no
minor unit is unchanged: a whole JPY amount still reads `¥3,456`. Fractional amounts
render exactly as before. The dashboard metric tile restated the cell's no-currency
width for a field with no currency resolved (no decimals for a whole amount); it now
restates two decimals, so a whole amount reads `3,456.00` on the tile as in the cell.

`formatCurrency` keeps its name, its signature and its `@object-ui/fields` export.
Nothing changes in the editable inputs.
