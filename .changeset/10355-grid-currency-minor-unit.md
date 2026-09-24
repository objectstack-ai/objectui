---
'@object-ui/fields': minor
---

The line-item grid (`GridField` / `LineItemsField`) stores and shows a currency
cell in its currency's own decimal places, never `scale ?? 2` and never a
default `¥` (objectui#10355).

A computed `currency` column (for example `amount = quantity * unit_price`) was
rounded to the column's `scale`, or to two decimals when it had none, before the
value was written back into the row. Every currency on earth got two decimals:
a yen amount was stored with cents yen does not have (JPY 3 × 1234.5 stored
`3703.5`), and a dinar amount lost its third digit (KWD 3 × 1.2345 stored `3.7`).
The display faces fell back to a literal `¥` whatever the currency was.

The grid now resolves its currency through `resolveFieldCurrency` — the tenant
default, since a grid column declares no field-level currency key — and:

- rounds a computed currency cell to that currency's ISO 4217 minor unit before
  storing it: whole yen for JPY, two decimals for USD, three for KWD. With no
  currency resolved the value is stored as computed, not at an invented two
  decimals;
- shows a computed currency cell, and a currency cell in the list form-factor,
  in that currency and at that width, and puts the currency's own symbol in the
  editable currency cell. With no currency resolved there is no symbol;
- keeps an authored `prefix` as the symbol, at the currency's width.

`computeRow` takes the tenant currency as a new optional third argument; called
without it, a computed currency cell is stored unrounded.

**Behaviour change** for grids with currency columns: a computed currency cell
no longer reads `scale`, in line with the ruling on
objectstack-ai/objectstack#19629 that takes `scale` off the `currency` type and
the ruling on objectstack-ai/objectstack#19910 that a currency's decimal places
are the currency's. A USD tenant's grid used to read `¥1,234.57` and now reads
`$1,234.57`. `number` columns are unchanged: their `scale` still rounds, and an
absent one still leaves the value unrounded.
