---
'@object-ui/plugin-grid': patch
---

The `object-grid` summary footer reads `currency`, `defaultCurrency`,
`precision` and `scale` from the object field only. A column that carries one
of these keys no longer changes the footer (objectui#11588).

`ListColumnSchema` (`@objectstack/spec/ui`) is a strict object, and it declares
none of the four keys. A view that authors one on a column is refused at publish
with `unrecognized_keys`. `useColumnSummary` read them anyway, and the column's
value won over the field's, so a column `currency` re-coded the total and a
column `scale` re-sized it. That read is retired rather than declared upstream,
and the footer now takes these hints the way it already took `currencyConfig`
and `max`, and the way the list cell above it reads them. The census behind the
ruling found no view that writes one of these keys on a grid column.

**Behaviour change.** A grid handed a column that carries `currency`,
`defaultCurrency`, `precision` or `scale` (which validation refuses) now formats
its footer from the object field's definition, falling back to the tenant
currency as before. A column's declared `type` still decides the footer's unit,
and a grid whose columns carry none of the four keys is unchanged. The exported
`useColumnSummary` signature does not change. Its `fieldMetadata` argument is
where these hints go.
