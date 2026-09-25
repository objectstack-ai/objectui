---
'@object-ui/plugin-grid': patch
---

A fixed-currency field shows its own currency in the grid cell and in the
column-summary footer, not the tenant's (objectui#10354).

`@objectstack/spec` refuses a field-level `currency`, so a fixed currency is
declared as `currencyConfig: { currencyMode: 'fixed', defaultCurrency: 'JPY' }`.
`resolveFieldCurrency` reads `currencyConfig.defaultCurrency`, but `ObjectGrid`
never handed it that key. On the three configured-column paths (`columns` as
objects, `columns` as field names, and inline rows with a `fields` projection)
the cell's field metadata carried `currency`, `precision` and `scale` but not
`currencyConfig`, and `useColumnSummary` carried no `currencyConfig` into the
footer. In a USD tenant, a JPY-fixed amount of 1234 read `$1,234` in both
places, while the grid's auto-generated columns and the currency cell given the
whole field definition read `¥1,234`.

Those cells now receive the field's `currencyConfig` as declared, and
`useColumnSummary` passes the field's `currencyConfig` to the same resolver, so
the cell and the footer show the same currency. A field without
`currencyConfig` still shows the tenant currency. The `fieldMetadata` parameter
type of `useColumnSummary` gains an optional `currencyConfig` member, typed as
the spec's own `CurrencyConfig`. The footer reads `currencyConfig` from the
field only: `ListColumnSchema` declares no such column key.

**Behaviour change.** On those paths, a field whose `currencyConfig` is in
`fixed` mode now shows `currencyConfig.defaultCurrency` in the cell and the
footer where it used to show the tenant currency. A field in `dynamic` mode
still shows the tenant currency, because `resolveFieldCurrency` reads
`currencyConfig.defaultCurrency` only in `fixed` mode (objectui#10422). The
grid's auto-generated columns already showed a fixed field's currency.
