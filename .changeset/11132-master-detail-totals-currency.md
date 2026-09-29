---
'@object-ui/plugin-form': patch
---

fix(plugin-form): the master-detail form's Subtotal / Tax / Total show the amount's currency, not a hard-coded yen sign (objectui#11132)

The document totals stack under a master-detail form's line items printed a
literal `¥` in front of every amount, whatever the amount field's currency or the
tenant's. A USD tenant's invoice read `¥1,234.50` under lines in dollars.

The stack now resolves its currency through `resolveFieldCurrency`, the one
precedence every currency face shares: the amount field's fixed currency
(`currencyConfig` with `currencyMode: 'fixed'`), else the tenant's default
currency. The field definition is the one the form already loads from the child
object to derive or hydrate its columns. The amount is `Intl`'s currency format in
the display locale, so:

- the sign sits where the locale puts it: `$1,234.50` in English, `1.234,50 $` in
  German;
- the decimal places are the currency's own: two for USD and EUR, none for JPY
  (a JPY tenant's stack read `¥1,234.50` and now reads `¥1,235`), three for KWD;
- the digits still follow the display locale, as objectui#9909 made them.

With no currency known, or when the stack adds entries whose amounts resolve to
different currencies, the lines are plain numbers at two places with no sign.

A fully configured detail entry (relationship field and every column typed) loads
no child schema, so its amount field's own currency is not read and the stack
shows the tenant's currency for it.
