---
'@object-ui/i18n': minor
---

A currency field in `dynamic` mode shows the tenant's currency, not its
`currencyConfig.defaultCurrency` (objectui#10422).

`@objectstack/spec` declares two currency modes: `fixed` (a single currency) and
`dynamic` (user selectable). Its field guidance says a field without a fixed
currency uses the tenant default at runtime. `resolveFieldCurrency` read
`currencyConfig.defaultCurrency` in either mode, so in a USD tenant a field
declaring `currencyConfig: { currencyMode: 'dynamic', defaultCurrency: 'EUR' }`
showed `€3,456` where it should show `$3,456`. An empty `currencyConfig`, which
the spec parses to a dynamic config with `defaultCurrency: 'CNY'`, showed
`CN¥`.

The resolver now reads `currencyConfig.defaultCurrency` only when
`currencyMode` is `'fixed'`. Its precedence is: the explicit `currency`, then a
fixed `currencyConfig.defaultCurrency`, then the legacy top-level
`defaultCurrency`, then the tenant default. With none of these, it returns
`undefined` and the amount shows as a plain number.

**Behaviour change.** Every face that resolves a currency through
`resolveFieldCurrency` changes together: the list cell, the field widget, the
metric tile, the detail summary chip, the gantt tooltip, and the grid's
configured cells and summary footer. On each of them, a field in `dynamic` mode
now shows the tenant currency. So does a `currencyConfig` that names no
`currencyMode`, because the spec's default mode is `dynamic`. To keep a field on
one currency, declare `currencyMode: 'fixed'`. A fixed field renders as before.

The parameter type of `resolveFieldCurrency` gains an optional
`currencyConfig.currencyMode` member (`'dynamic' | 'fixed'`), which is the
spec's enum.
