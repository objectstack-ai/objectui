---
'@object-ui/fields': minor
---

The line-item grid (`GridField` / `LineItemsField`) no longer gives a currency
cell a default of two decimal places or a default `¥` symbol. A currency column
without a `scale` now uses its currency's own decimal places (objectui#10355).

A computed `currency` column (for example `amount = quantity * unit_price`) was
rounded to the column's `scale` before the value was written back into the row,
and to two decimals when the column had no `scale`. That default gave every
currency two decimals: a yen amount was stored with cents yen does not have
(JPY 3 × 1234.5 stored `3703.5`), and a dinar amount lost its third digit
(KWD 3 × 1.2345 stored `3.7`). The display fell back to a literal `¥` whatever
the currency was.

The grid now resolves its currency through `resolveFieldCurrency`. That is the
tenant default, since a grid column declares no field-level currency key. A
currency column's decimal places are:

- its authored `scale`, when it has one. The stored value already used it, and
  the display now does too. The spec's `InlineGridColumnSchema.scale` declares
  it for a computed numeric or currency result;
- otherwise that currency's ISO 4217 minor unit, which replaces only the old
  default of two: whole yen for JPY, two places for USD, three for KWD;
- otherwise none. With neither a `scale` nor a resolved currency, the computed
  value is stored as computed, not at an invented two places.

The same places decide the stored value of a computed currency cell and how a
currency cell is shown, both the computed cell and the list form-factor. The
cell shows the resolved currency, and the editable currency cell shows that
currency's own symbol. With no currency resolved there is no symbol. An
authored `prefix` still replaces the symbol. An authored `scale` above the
engine's limit of 100 is clamped and reported on the display too, as it
already was for the stored value (objectui#10071).

`computeRow` takes the tenant currency as a new optional third argument. Called
without it, a currency column with no `scale` is stored unrounded.

**Behaviour change** for grids with currency columns and no `scale`: a computed
cell is stored and shown at the currency's minor unit instead of two places, in
line with the ruling on objectstack-ai/objectstack#19910 that a currency's
decimal places are the currency's. A USD tenant's grid used to read `¥1,234.57`
and now reads `$1,234.57`. Columns with an authored `scale`, and `number`
columns, round as before.
