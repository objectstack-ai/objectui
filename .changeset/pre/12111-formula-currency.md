---
'@object-ui/fields': patch
---

A formula field declared `returnType: 'currency'` renders as money, in a list cell, a form and a record detail (objectui#12111).

`@objectstack/spec` 18 adds `currency` to `FieldSchema.returnType`: the formula's result is an amount of money, in the currency the formula's own `currencyConfig` declares, as a currency field declares it. Both formula faces drew such a value as plain text (`3456`). Now each one hands the formula's definition to the currency field's own face: `FormulaCellRenderer` to `CurrencyCellRenderer`, and `FormulaField`'s read-only face to `CurrencyField`'s. So a formula reads exactly what a currency field with the same `currencyConfig` reads. A `fixed` config shows its own currency (`CN¥3,456.00`). With no `currencyConfig`, or a `dynamic` one, the amount shows in the tenant's default currency.

A formula declared `number`, `text`, `boolean` or `date`, or declaring no `returnType`, renders as before. Nothing is added to the package entry.
