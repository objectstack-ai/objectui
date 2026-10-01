---
'@object-ui/app-shell': patch
---

The page-block inspector labelled the `object-form` `columns` field "Columns (grid layout)" in English and 「列数（网格布局）」 in Chinese. That pointed at the `grid` form layout, which objectui#7759 Group C retires. The field does not depend on `layout`. Measured through the real `SchemaRenderer`, `columns` sets how many columns the form's field grid has under either layout, and the spec row says the same: "Number of field columns (multi-column forms), honoured under either `layout`". `1` stacks the fields, `2` to `4` give that many columns at the responsive breakpoints, and leaving it out lets the form infer the count from the number of fields. The labels now read "Field columns (1–4)" and 「字段列数（1–4）」 (objectui#11168 slice 3). The field, its key and what it writes are unchanged.
