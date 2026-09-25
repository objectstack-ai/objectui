---
'@object-ui/plugin-dashboard': minor
---

fix(plugin-dashboard): a metric tile counting rows over a currency field shows a plain number, not money

`ObjectMetricWidget` decided to dress its number as money from the aggregated
field's TYPE alone, so `aggregate: { field: 'amount', function: 'count' }` over a
`currency` field showed `$3` for three records — a number of rows read as an
amount. The grid footer already reads the same count on a currency column as a
plain `3`.

The field's unit now applies only to an aggregate that answers in it: `sum`,
`avg`, `min` and `max` keep the currency face exactly as before (the list cell's
own `formatCurrency`), while `count` and `count_distinct` render as plain,
locale-formatted numbers. The same rule withholds a `percent` field's pattern
from a count, so three rows no longer read `3%` either — the footer's rule for a
percent column.

Visible behaviour change for dashboards that count over a currency or percent
field: the tile loses its currency symbol or percent sign. An authored `format`
or `currency` on the tile is the author's declaration and is not second-guessed.
