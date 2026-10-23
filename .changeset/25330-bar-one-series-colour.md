---
'@object-ui/plugin-charts': patch
---

A single-series bar chart draws every bar in its series colour (objectstack#25330).

A bar or horizontal-bar chart with one measure used to paint each bar a different palette colour, so the colour named nothing: the System Overview "Events by User" board drew each user in its own hue. A bar's colour now names its series. A dimension's semantic option colour (a select field's `options[].color`, such as health green/red/yellow) still paints its own bar; a category without one takes the series colour instead of a palette slot. Pie and donut slices keep one colour per category, and a chart with two or more series keeps one colour per series.
