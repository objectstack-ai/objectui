---
'@object-ui/fields': minor
---

`CurrencyField` takes its fraction digits from the currency, never from the
field-level `precision` (objectui#10276).

`@objectstack/spec` declares a field's `precision` as "Total digits
(non-negative integer)" — the `p` of a `decimal(p, s)` column, so a
DECIMAL(18,2) amount is `precision: 18, scale: 2`. The currency edit widget
passed that count to `Intl` as the number of decimal places, so a currency
field declaring `precision: 18` rendered eighteen decimal places, offered a
`step` of `0.000000000000000001` and rounded typed input to eighteen places on
blur. The currency cell renderer does not read `precision` and is unaffected.

The widget's one width is now the resolved currency's own ISO 4217 minor-unit
count — two decimals for USD or CNY, none for JPY, three for KWD — and it drives
the read-only display, the input's `step` and the blur rounding alike. A field
with no resolvable currency keeps two decimals. The widget does not read `scale`
for the width either (it never did), in line with the ruling on
objectstack-ai/objectstack#19629 that takes `scale` off the `currency` type.

**Behaviour change** for currency fields that declare `precision`: the declared
value no longer sets the decimal places shown, the `step`, or the blur rounding.
Where it differed from the currency's own digit count (or from two decimals on a
field with no currency), the output moves: `precision: 2` on a JPY field used to
show `¥1,234.50` and now shows `¥1,235`; `precision: 0` on a USD field used to
show `$1,235` and now shows `$1,234.50`. This reverses the "an explicitly
authored `precision` still wins" rule objectui#4361 published, under the
maintainer ruling recorded on objectstack-ai/objectstack#19910 that a
currency's decimal places are the currency's, not a setting. Fields that declare
no `precision`, or one equal to the currency's own digit count, render exactly
as before.

**Migration.** Nothing to restate: a currency field's decimal places follow its
currency. Keep `precision` only as the total digit count of the stored decimal.
