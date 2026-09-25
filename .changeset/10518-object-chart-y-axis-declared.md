---
'@object-ui/types': minor
---

`ObjectChartSchema` (and its TS twin) declares `yAxis` as `@objectstack/spec`'s axis config list,
`ChartAxisSchema[]`. The Zod mirror references the spec schema, and the TS side is typed by the
spec's `ChartAxis`. Until now the key rode `BaseSchema`'s passthrough unchecked (objectui#10518,
ruling 5809510046, branch 2, declare). This is the `object-chart` sibling of the objectui#7690
declaration on `ChartSchema`.

- The spec declares the key on this node. The `REACT_BLOCKS` entry for `<ObjectChart>` has
  `schemaType: 'object-chart'` and `schema: ChartConfigSchema`, and lists `yAxis` in its
  `dataProps`.
- A real producer writes it: the objectstack showcase command-center page's dataset-bound charts
  author `yAxis: [{ field, stepSize: 1 }]`. That document still parses, unchanged.
- The spec's `.default()`s are not written into the parse output. An omitted `showGridLines` or
  `logarithmic` stays omitted.

⚠️ Shipped as `minor`, not `patch`: documents that validated before now **refuse** (the accept set
narrows), and each of them draws a chart today:

- A `yAxis` entry with a malformed value (`stepSize: 'big'`, `position: 'middle'`), an undeclared
  key (`logScale`, `grid`) or no `field`. The renderer ignores what it cannot read and draws the
  rest.
- A `yAxis` written as a single object or a bare column name. The renderer's normalizer honours
  both as a tolerance. Neither is a member of the spec's list, and no producer on this node writes
  either, so they are refused (the reading objectui#7690 applied to `ChartSchema.yAxis`). The
  normalizer is unchanged.

`xAxis` on this node is not declared by this change. It stays open on objectui#10518.

No renderer changed.
