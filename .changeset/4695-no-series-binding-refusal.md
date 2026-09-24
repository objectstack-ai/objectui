---
'@object-ui/plugin-charts': patch
---

fix(charts): a cartesian chart that declares no series at all now says so instead of drawing an empty frame (objectui#4695)

A `bar` / `horizontal-bar` / `line` / `area` / `combo` (and `column`) chart handed
data rows but no series binding — no `series`, no `categories`, no y-axis `field`,
so `series` reaches the renderer as `undefined` — drew axes, grid, tooltip and
legend around zero marks and said nothing. It now renders the same placeholder
objectui#4683 introduced for a computed-but-empty series list
(`data-chart-error="no-plottable-series"`, `role="status"`), with its own sentence:
"none was declared" rather than "no measure or group reached" the axis, and a
console warning that lists the row keys a series could name.

Unchanged: a chart with no rows; pie, donut, funnel, radar and scatter charts,
which fall back to a `value` column and keep drawing; and every chart that
declares its series.
