---
'@object-ui/plugin-charts': patch
---

A chart's `xAxis` object is no longer dropped when it carries `min`, `max`, `stepSize`,
`logarithmic` or `position` without also carrying `title`, `format` or `showGridLines`
(objectui#10516).

`normalizeChartSchema` kept the x-axis object only when one of those three hand-named keys
was present. Any other axis lost everything but its `field`, so a scatter authored with
`xAxis: { field: 'progress', min: 0, max: 200, stepSize: 50 }` drew the auto-fitted x
domain and ticks instead of the ones it declared, and nothing refused. The object is now
kept whenever it carries any key of the spec's `ChartAxisSchema` other than `field`. The
key set is the one the normalizer reads, not a second hand-written list.

**User-visible render change.** A scatter whose `xAxis` declares `min` / `max` /
`stepSize` / `logarithmic` with no title, format or grid flag now draws the x scale it asked
for. That completes objectui#9675's x-axis repair for axes written that way. An `xAxis`
carrying only `field` renders as before.

`position` on `xAxis` now survives normalization too, but at this change no renderer reads
it: the x axis draws along the bottom whatever it says.

⚠️ **Dated note, 2026-09-25 — the renderer now reads `xAxis.position` — objectui#10587.**
Later in this same release the x axis takes the side `position` names where that axis can
run along it, and a side it cannot take draws the default side with a note naming the key.
The sentence above is kept as the reading of this change; the objectui#10587 entry states
what ships.
