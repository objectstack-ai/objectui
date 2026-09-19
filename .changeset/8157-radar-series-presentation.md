---
'@object-ui/plugin-charts': patch
---

Honour a radar series' declared presentation keys (objectui#8157).

On `chartType: 'radar'` the mark rendered a bare `fillOpacity={0.6}` and read nothing
off the series, so three things `@objectstack/spec` declares for every `ChartSeries`
were inert at once — `opacity` and `dashArray` (both read by `normalizeSeries` and then
discarded) and the whole `variant: 'comparison'` treatment, which is declared and
documented with no family restriction. A radar series carrying any of the three drew
identically to one carrying none, while every cartesian mark in the same file resolved
its presentation through the shared `seriesStyle` helper.

The radar arm now calls that helper like the cartesian arms do:

- an authored `opacity` sets both the polygon's fill and its stroke opacity;
- an authored `dashArray` dashes the polygon outline — radar is a stroked mark, so
  unlike a bar or a scatter this is a family where a dash actually paints;
- `variant: 'comparison'` mutes a radar overlay, taking the `area` family's defaults
  (radar being the other mark this renderer both strokes and fills) rather than any
  newly invented numbers.

**The default face does not move.** `0.6` was a default as much as a bug — a radar fill
needs some opacity or an overlay is unreadable — so the literal became the fallback
(`fillOpacity={pres.fillOpacity ?? 0.6}`) instead of being deleted. A radar series that
declares none of the three keys paints exactly what it painted before: `fill-opacity`
`0.6`, no stroke fade, no dash. Already-drawn radar charts that author nothing are
untouched; only a chart that authors one of the keys changes, which is the repair.

No cartesian arm changed. The helper gained `'radar'` in its `kind` union and an
`areaLike` binding that is exactly `kind === 'area'` for every cartesian kind.
