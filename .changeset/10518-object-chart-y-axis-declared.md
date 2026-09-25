---
'@object-ui/types': minor
---

`ObjectChartSchema` (and its TS twin) declares `xAxis` and `yAxis` as `@objectstack/spec`'s axis
config: `xAxis` is ONE `ChartAxisSchema` object and `yAxis` a list of them. The Zod mirror references
the spec schema, and the TS side is typed by the spec's `ChartAxis`. Until now both keys rode
`BaseSchema`'s passthrough unchecked (objectui#10518, ruling 5809510046, branch 2, declare). This is
the `object-chart` sibling of the objectui#7690 declaration on `ChartSchema`.

- The spec declares both keys on this node. The `REACT_BLOCKS` entry for the `ObjectChart` react
  block has `schemaType: 'object-chart'` and `schema: ChartConfigSchema`, and lists `xAxis` and
  `yAxis` in its `dataProps`.
- Real producers write them. The objectstack showcase command-center page's dataset-bound charts
  author `yAxis: [{ field, stepSize: 1 }]`, and its renewals-pipeline page writes
  `xAxis: { field }` with `yAxis: [{ field, format }]`. Both still parse, unchanged.
- The spec's `.default()`s are not written into the parse output. An omitted `showGridLines` or
  `logarithmic` stays omitted.
- `xAxis` is the object ONLY. There is no string arm and no fold onto `xAxisKey`: the bare-string
  alias of objectui#7113 belongs to the `chart` node alone, and the spec's `ChartConfigSchema.xAxis`
  has no string arm (seat decision on objectui#10518, option A).

⚠️ Shipped as `minor`, not `patch`: documents that validated before now **refuse** (the accept set
narrows), and each of them draws a chart today:

- An `xAxis` object with a malformed value (`min: 'zero'`, `position: 'middle'`), an undeclared
  key (`grid`, `logScale`) or no `field`. It is refused as one issue at `xAxis` whose message carries
  the spec's own diagnostic, including its alias hint.
- An `xAxis` written as a bare column name (`xAxis: 'status'`), a list of axis objects, or any other
  non-object value. It is refused with the remedy `xAxis: { field }`. The renderer's normalizer still
  honours a bare string as a tolerance, and that is unchanged, but no producer on this node writes
  one.
- A `yAxis` entry with a malformed value (`stepSize: 'big'`, `position: 'middle'`), an undeclared
  key (`logScale`, `grid`) or no `field`. It is refused at the entry's own path. The renderer ignores
  what it cannot read and draws the rest.
- A `yAxis` written as a single object or a bare column name. The renderer's normalizer honours
  both as a tolerance. Neither is a member of the spec's list, and no producer on this node writes
  either, so they are refused with a remedy (the reading objectui#7690 applied to
  `ChartSchema.yAxis`). The normalizer is unchanged.

A TS consumer that typed a bare-string `xAxis` onto an `ObjectChartSchema` value no longer compiles.
The one in-repo instance, a renderer-tolerance test fixture, now carries an explicit cast.

No renderer changed.
