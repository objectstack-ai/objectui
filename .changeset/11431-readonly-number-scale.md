---
'@object-ui/fields': patch
---

fix(fields): a read-only number field shows its value the way its table cell does (objectui#11431)

A read-only `NumberField` printed the raw stored value. A field declaring `scale: 2`
and holding `1234.5` read `1234.5` in a read-only form, exactly as with no `scale`,
while `NumberCellRenderer` showed the same field `1,234.50`: the read-only face applied
no decimal width, no thousands grouping and no display locale.

Both faces now make the same formatting call. The width is the one `resolveFieldScale`
in `@objectstack/spec/data` answers, the grouping follows the field's `useGrouping` over
the `scale` heuristic, and the locale is the display locale. So the form and the table
show one field's value identically: `1,234.50` for `scale: 2`, the value's natural
precision (`1,234.5`) when no `scale` is declared, `2026` for a `scale: 0` year, and
`1.234,50` in German. An empty value still shows the placeholder.

Nothing changes in the editable input, in the table cell's output, or in any exported
name or type.
