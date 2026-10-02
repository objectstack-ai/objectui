---
'@object-ui/plugin-dashboard': minor
---

Dashboard percent faces read the storage they are told, never a storage guessed
from the value (objectui#11475).

- **`object-metric` over a `percent` field** renders its `sum` / `avg` / `min`
  / `max` at the field's own storage (`percentCellScale`, the spec's
  `percentScaleOf`), through the list cell's `formatPercent`, the way it already
  renders a currency. A field declaring `max: 100` that averages `50` reads
  `50%`. The width is the authored `%` pattern's decimals, or else the
  field's width.
- **`metric` with a `%` pattern** holds no field, so the pattern states the
  storage: numeral's `%` multiplies by 100, so the value is a fraction. A ratio
  of exactly `1` reads `100%` again. A stored value of `1` or more is
  multiplied by 100 now, where the old guess passed it through.
- **`renderFieldValue`** (the data table and the record drawer) reads a
  `percent` or `progress` field's storage from its declaration. `FieldMeta` gains
  `max`, copied from the schema field def by `buildFieldMeta`. As a `FieldMeta`
  member it joins `ObjectDataTable`'s read-side refusal band, so an authored
  column cannot restate how its field stores. Any other field with a `%`
  pattern reads its value as a fraction, numeral's reading.
