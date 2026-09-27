---
'@object-ui/plugin-charts': patch
---

A cartesian chart whose series are bound to a column no row carries now says so, naming the
column, instead of drawing an empty frame (objectui#10396). The tile renders the existing
`data-chart-error` placeholder with the new code `missing-series-key` and a sentence worded after
`missing-category-key`: "This chart cannot plot its series: no row has a `KEY` field." Several
missing keys are joined with "or". A console warning names the missing keys and the keys the rows
do carry, as the category refusal's warning does.

The shape is objectui#8266's: a fieldless count projects its value as `count`, and a series bound to
`value` over those rows drew the category ticks and zero marks, silently. What now refuses, each of
which drew zero marks before: a bar / column / horizontal-bar / line / area / combo chart with rows,
when not one row carries ANY bound series key. That holds whatever else the chart declares: a
stack, a declared `min` / `max` or `stepSize`, or a second axis.

What keeps drawing, unchanged: a chart where even one row carries the key; a chart where one bound
key is carried and another is not (the carried series draws); and a dotted key such as `a.b`,
which the chart resolves into nested rows. A dotted key is never judged missing, so a chart that
binds one stays silent even when it resolves nothing. A column no row carries beside a key that is
carried but has no numeric value (for example an all-boolean series) also stays silent, as before.

Precedence: `missing-category-key` wins when the category key is missing too, and
`no-plottable-series` still owns a chart with no series at all. A key that IS carried but holds no
numeric value on any row keeps `no-numeric-value` (objectui#7195). Scatter, pie, donut, funnel,
treemap and radar never receive this code.
