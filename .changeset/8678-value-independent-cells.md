---
'@object-ui/fields': patch
---

fix(fields): an empty `password`, `secret`, `vector` or `grid` cell now says "No value"

These four cell renderers never read their value. `password` and `secret` drew
the six-dot mask and `vector` and `grid` printed `[Vector]` and `[Grid]` for every
input, `null` included. A credential that was never set therefore looked exactly
like one that is set wherever the cell is drawn for an empty value, such as an
`ObjectGrid` column.

An empty value now renders the shared `EmptyValue` affordance, whose accessible
name is "No value":

- `password` / `secret` use the string class's rule, the same one `text` applies:
  `null`, `undefined`, `''` and `[]` are empty. `{}` and a whitespace-only string
  are stored values and keep the mask.
- `vector` / `grid` use the shared emptiness floor: `null`, `undefined`, `''` and
  `[]`.

A stored value renders exactly what it rendered before: the same mask, the same
literal. The value of a `password` or `secret` is still never printed.
