---
'@object-ui/plugin-charts': patch
---

fix(plugin-charts): a scatter chart's grid now honours the spec axis `showGridLines`

The scatter branch drew its grid from a hard-coded `vertical={false}` instead
of the grid config every other cartesian family derives from the spec axes, so
`showGridLines` declared on either scatter axis was accepted and then dropped.
It now uses that same derivation: `yAxis.showGridLines: false` removes the
horizontal lines and `xAxis.showGridLines: true` adds vertical ones.

A scatter whose axes declare no `showGridLines` renders exactly as before
(horizontal lines only).
