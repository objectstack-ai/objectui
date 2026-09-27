---
'@object-ui/plugin-charts': patch
---

A `scatter` chart's `yAxis` entry after the first now carries a note naming it, instead of
going unused in silence (objectui#10721).

`@objectstack/spec` declares `ChartConfig.yAxis` as an uncapped list, so a second entry
validates; a `scatter` chart draws one value axis, the first entry's. objectui#10691 gave the
bar (`column`), line, area, combo and `horizontal-bar` charts a note for each entry after the
second, and left `scatter` as it was: with `series` authored, a second or later entry drew no
axis and no note, and its `title`, `format`, `min` and `max` went unused.

- **The note.** Every entry after the first gets a `p role="note"
  data-chart-note="y-axis-undrawn"` under the plot, in the `ChartFootnote` channel
  objectui#10691's note uses. It names `yAxis[N]` and the one axis the chart draws, `yAxis[0]`.
  It says nothing about a series derived from the entry: with neither `series` nor
  `categories`, two entries that carry a `field` are refused as before
  (`data-chart-error="scatter-multi-series"`).
- **One answer.** The scatter slice moved into `placeYAxes`, which now takes the chart family,
  so the renderer and the normalizer place the same entries. A series the normalizer derives
  from an entry after the first now binds to the slot the one axis is drawn in, where it used to
  bind as if the chart drew two axes. A scatter reads no series binding and measures its one
  series against that axis, so what it draws does not move.
- **Not narrowed.** The accepted count does not move, and the chart is not refused: the spec
  owns the `yAxis` face.

A `scatter` chart with one entry, and every other family, render as before.
