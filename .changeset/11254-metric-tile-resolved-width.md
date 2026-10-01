---
'@object-ui/plugin-dashboard': patch
---

fix(plugin-dashboard): the `object-metric` tile shows a percent or number aggregate at the field's declared width

A metric tile over a `percent` or `number` field picked its pattern from the
field's type alone, so it never showed the decimals the field declares. A
`number` field declaring `scale: 2` whose average is 3.75 read `4`, and a
`percent` field declaring `scale: 2` read `12%` beside list cells reading
`12.34%`.

The tile now reads the field's width through `resolveFieldScale` from
`@objectstack/spec/data`, the same answer the list cell, the record header chip,
the grid footer and the percent edit widget use:

- a declared `scale` shows as declared: `3.75`, `12.34%`, and `scale: 3` pads to
  `1.500`;
- a `percent` that declares nothing keeps whole percents, the protocol's width;
- a `min` or `max` over a `number` that declares nothing shows the value at its
  own decimals (`0.99`, not `1`), since that value is one of the records' own
  values.

A `sum` or `avg` over a `number` that declares no `scale` keeps its
whole-number display: the tile does not see the values the server aggregated,
so their widths are not known to it. An authored `format` on the widget still
wins, and a `count` is still a plain number of rows.

`@object-ui/plugin-dashboard` now depends on `@objectstack/spec` at runtime,
from `^17.5.0`, the first release exporting `resolveFieldScale`.
