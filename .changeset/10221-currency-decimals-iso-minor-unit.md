---
'@object-ui/plugin-grid': minor
'@object-ui/plugin-dashboard': minor
'@object-ui/app-shell': minor
---

The grid summary footer and the dashboard metric tile take a currency amount's
decimal places from the currency, never from `scale`, and the field designer no
longer offers `Scale` on a currency field (objectui#10221).

The currency arm of the grid column-summary footer (`useColumnSummary` in
`@object-ui/plugin-grid`) and the currency face of `ObjectMetricWidget` in
`@object-ui/plugin-dashboard` each took the number of decimal places from the
field's `scale`, with none when `scale` was absent. The currency list cell
never read `scale`. So a USD column declaring no `scale` totalled
`1234.5` as `$1,235` under cells reading `$1,234.50`, and a JPY field carrying
`scale: 4` showed `¥1,234.5000`.

Both faces now format an amount in a resolved currency with `formatCurrency`
from `@object-ui/fields`, the list cell's own formatter, so footer, tile and
cell agree. The width is the resolved currency's own ISO 4217 minor-unit count: two
decimals for USD or CNY, none for JPY, three for KWD. A whole amount shows no
fraction (`$1,234`), as the cell does. When no currency resolves, the amount is
a plain number with two decimals, or none when it is whole, as the cell renders
it. Neither `scale` nor
`precision` is read on a currency. This follows the maintainer ruling recorded
on objectstack-ai/objectstack#19910 that a currency's decimal places are the
currency's, not a setting, and the ruling on objectstack-ai/objectstack#19629
that takes `scale` off the `currency` type. The footer keeps its existing
tenant-locale fallback for a currency code `Intl` does not accept, and a metric
tile with an authored `format` pattern still renders that pattern.

The field designer's numeric section (`ObjectFieldInspector` in
`@object-ui/app-shell`) no longer offers a `Scale` control on a `currency`
field. `number` and `percent` fields keep it. The `Precision` control stays on
all three: it writes the field-level `precision`, the total digit count of the
stored decimal, not a number of decimal places.

**Behaviour change** for currency amounts on the footer and the tile, filed as
`minor` because this repo's fixed release group forbids `major`. Where the
field's `scale` differed from what the cell renders, the output moves:

- `scale: 2` on a JPY field used to show `¥1,234.50` and now shows `¥1,235`.
- A USD field with no `scale` used to show `$1,235` for `1234.5` and now shows
  `$1,234.50`.
- A whole USD amount under `scale: 2` used to show `$1,234.00` and now shows
  `$1,234`, like the cells.

Percent columns and fields still take their width from `scale`.

**Migration.** Nothing to restate: a currency amount's decimal places follow its
currency. Delete `scale` from currency fields. A dashboard that wants a fixed
pattern on a metric tile declares it with `format`.
