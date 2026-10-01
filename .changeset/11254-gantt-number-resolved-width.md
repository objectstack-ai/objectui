---
'@object-ui/plugin-gantt': patch
---

fix(plugin-gantt): a number row in the gantt tooltip shows the field's declared decimals, and none when it declares none

A tooltip row over a `number` field (and the `integer`, `float` and `decimal`
spellings the tooltip groups with it) always read two decimals, whatever the field
declared. A field declaring `scale: 3` read `1.50`, a field declaring `scale: 0` read
`1.50`, and a `number` with no `scale` read `1.50` while the list cell for the same
value read `1.5`. The row now reads the field's width through `resolveFieldScale`
from `@objectstack/spec/data`, as the list cell does. A declared `scale` is that
width. A field with no `scale` shows the value as stored (`1.5`, `12`, `7`), because
the protocol gives these types no default width.

Only the decimals change. The row still uses the display locale, and it still groups
thousands as before.
