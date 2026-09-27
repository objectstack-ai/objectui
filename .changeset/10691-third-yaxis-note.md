---
'@object-ui/plugin-charts': patch
---

A chart's `yAxis` entry after the second now carries a note naming it, instead of going unused
in silence (objectui#10691).

`@objectstack/spec` declares `ChartConfig.yAxis` as an uncapped list, so a third entry
validates; a bar (`column`), line, area, combo or `horizontal-bar` chart draws at most two value
axes, one per slot. Such an entry drew no axis and no note, while its `title`, `format`, `min`
and `max` went unused and a series derived from it plotted against the right-hand axis.

- **The note.** Every entry after the second gets a `p role="note"
  data-chart-note="y-axis-undrawn"` under the plot, in the `ChartFootnote` channel the
  `x-axis-position` / `y-axis-position` notes use. It names `yAxis[N]` and, when the chart
  declares neither `series` nor `categories`, the axis its `field` is plotted against: the one
  in the right-hand slot (the top one on `horizontal-bar`), and the entry drawn there.
- **One answer.** `placeYAxes` lists the entries it draws on no axis (`undrawn`), with the slot
  a series derived from one binds to. The normalizer binds that series from the list, and the
  renderer writes the note from it. The binding itself is unchanged: the right-hand slot, as
  before.
- **Not narrowed.** The accepted count does not move, and the chart is not refused: the spec
  owns the `yAxis` face.

A chart with two entries or fewer, a `scatter` chart (it draws one y axis), and a family that
draws no value axis render as before.
