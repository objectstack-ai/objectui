---
'@object-ui/plugin-charts': patch
---

A chart's `yAxis[].position` now places each value axis, and `horizontal-bar` lays out and
binds its axes (objectui#10654, the y-side twin of objectui#10587; objectui#10655 folded in).

`position` is declared on `@objectstack/spec`'s `ChartAxisSchema`, which each `yAxis` entry
takes, and the normalizer keeps it. No axis was placed by it: it only chose which entry
configured the right-hand axis a combo always draws (and the value format of a right-bound
series), and how the normalizer bound the series it derives from the entries. So a lone
`position: 'right'` entry drew its axis on the left, `top` / `bottom` passed in silence, a second
entry was always the right-hand axis, and with no `series` a first entry at `right` took both
derived series to the right-hand axis.

- **Where each entry is drawn.** `placeYAxes` (in `normalizeChartSchema`) is the one place a y
  side is resolved; the normalizer binds each series it derives from the entries with the same
  call, so a derived series plots against its own entry's axis.
  - bar (`column`), line, area, combo and scatter: `left` / `right`. Scatter draws one y axis,
    the first entry's.
  - horizontal-bar: the value axes run across the plot, so `bottom` / `top`; a series'
    `yAxis: 'left'` binds the bottom axis and `'right'` the top one.
  - A lone entry's axis is drawn on the side it names. With two entries each is drawn on the
    side it names, and an entry that names no side takes the side the other left free.
  - **Both entries naming the same side:** the first keeps it and the second is drawn on the
    other side, with a note naming `yAxis[1].position`. `yAxis[0]` is already the primary axis
    (its `showGridLines` governs the horizontal grid), and declaration order is the one
    tie-break an author can read off the metadata.
  - A side a value axis cannot take is refused: the entry is placed as if it named none, and
    the chart shows a note under the plot (`data-chart-note="y-axis-position"`) naming
    `yAxis[N].position`, the value and the side the axis was drawn on. `ChartAxisSchema` is
    shared by both axes and is not narrowed.
- **horizontal-bar.** Two entries draw two value axes, along the bottom and the top, and the
  bars bind to them; they were bound to `yAxisId`s the branch never rendered, and bars were
  dropped. `xAxis.title` is drawn on the category axis, and the `yAxis` title is laid out for an
  axis running across the plot, under it at the bottom and over it at the top.
- **Grid and annotations** bind to the rendered left value axis whenever the value axes carry
  ids (a combo always; bar, line, area and horizontal-bar with two entries). They were bound to
  an axis id those charts do not render: a two-entry chart's horizontal grid lost its per-tick
  lines and its `axis: 'x'` annotations, a combo with fewer than two entries drew no annotation,
  and a two-entry horizontal-bar dropped its `axis: 'y'` annotations.
- **A right-hand value axis** lays its title out on the far side of its tick labels, the left
  layout mirrored, as a top x axis mirrors the bottom one.

**User-visible render change** for a chart whose `yAxis` entries declare `position`, a
horizontal-bar with an axis title or two `yAxis` entries, the grid and annotations of two-entry
and combo charts, and the title of every right-hand value axis.
`ChartRenderer.yAxisPosition-10654.test.tsx` pins each row against its `bar` control.
