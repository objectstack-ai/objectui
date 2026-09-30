---
'@object-ui/plugin-charts': patch
---

A chart's `xAxis.position` now places the x axis, and a side that axis cannot take is
refused with a note that names the key (objectui#10587).

`position` is declared on `@objectstack/spec`'s `ChartAxisSchema`, which `xAxis` takes by
reference, and since objectui#10516 the normalizer keeps it on the x-axis object. No axis
read it, so `xAxis: { field: 'month', position: 'top' }` validated and still drew the axis
along the bottom.

- **bar, line, area and scatter** (and a combo derived from its series' families): the x
  axis runs across the plot. `top` draws it along the top; `bottom` draws it along the
  bottom, the default.
- **horizontal-bar**: the `xAxis` object configures the category axis, which runs down the
  plot there (its `format` already applied to that axis). `left` or `right` puts the
  category axis on that side; the default stays the left.
- **A side the axis cannot take** (`left` / `right` across the plot, `top` / `bottom` on
  horizontal-bar) draws the axis at its default side, and the chart shows a note under the
  plot (`data-chart-note="x-axis-position"`) naming `xAxis.position`, the value, and the
  side the axis was drawn on. The value still validates: `ChartAxisSchema` is shared by the
  x and y axes, and this change does not narrow it.

A top axis also mirrors its title and its rotated tick labels, so both stay on the far side
of the axis from the plot.

**User-visible render change** only for a chart whose `xAxis` declares `position`. The
bottom / no-position controls in `ChartRenderer.xAxisPosition-10587.test.tsx` pin that a
chart declaring none still draws its x axis along the bottom with no note.
