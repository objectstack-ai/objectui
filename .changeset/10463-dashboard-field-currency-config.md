---
'@object-ui/plugin-dashboard': patch
---

A fixed-currency field shows its own currency in the dashboard table widget and
in the record drawer it opens, not the tenant's (objectui#10463).

`@objectstack/spec` refuses a field-level `currency`, so a fixed currency is
declared as `currencyConfig: { currencyMode: 'fixed', defaultCurrency: 'JPY' }`.
`buildFieldMeta`, the helper both `ObjectDataTable` and `RecordDetailDrawer`
build their field metadata with, read only the flat `currency` and
`defaultCurrency` keys and never `currencyConfig`. In a USD tenant, a JPY-fixed
amount of 1234 read `$1,234` in the table cell and in the drawer, while the
grid and the metric tile read `¥1,234` for the same field.

`buildFieldMeta` now resolves the field's currency through
`resolveFieldCurrency` from `@object-ui/i18n`, the resolver the grid, the
metric tile and the currency cell already share. A column's own `currency`
still wins over the field's. The resolver is called without the tenant
default, so a column `format` that starts with a currency symbol still wins
over the tenant currency, as before.

**Behaviour change.** In the dashboard table widget and the record drawer, a
field whose `currencyConfig` is in `fixed` mode now shows
`currencyConfig.defaultCurrency` where it used to show the tenant currency. A
field in `dynamic` mode, or with a `currencyConfig` that names no
`currencyMode`, still shows the tenant currency, because the resolver reads
`currencyConfig.defaultCurrency` only in `fixed` mode (objectui#10422). A field
that carries both a fixed `currencyConfig` and the legacy top-level
`defaultCurrency` now shows the fixed code, which is the resolver's order.
