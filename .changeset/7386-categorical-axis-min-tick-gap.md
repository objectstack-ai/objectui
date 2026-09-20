---
'@object-ui/plugin-charts': patch
---

Fix categorical (bar/line/area/combo) x-axis labels still being dropped above
5 buckets (objectui#7386, follow-up to objectui#7247).

`xAxisCommonProps` charged every band axis above `X_AXIS_ALL_LABELS_MAX_BUCKETS`
a `minTickGap` of 48px (32px mobile) — a time-series budget that recharts adds
**on top of** its own measured-overlap check, not instead of it. A 7-status
pipeline at a 290px widget (≈33px/band) dropped 4 of its 7 names even though
nothing was actually wide enough to collide.

`minTickGap` is now `0` for that branch: recharts' own measured-width overlap
avoidance (`interval: 'preserveStartEnd'`, unchanged) is the only thing
governing tick density above the bound, same as it already was for every tick
it kept. Verified in real Chromium — this repo's DOM test environment reports
zero text metrics, so it cannot exercise this change at all: at 7 and 8
buckets and realistic widget widths, every label now draws with zero measured
overlap (checked against each rotated label's true rotated rectangle, not an
axis-aligned box); a 180-point daily series at 800px still thinned sensibly
(11 ticks, zero overlap) — the "hundreds of points" case objectui#7247 guarded
against stays protected by the same measured-overlap check, just without the
removed extra margin.

Not changed: `X_AXIS_ALL_LABELS_MAX_BUCKETS` / the ≤5-bucket "draw everything"
branch (objectui#7247, out of this issue's scope); the scatter chart's own
`minTickGap` (its x axis is `type="number"`, a genuinely continuous measure,
not a categorical band — a different axis with a different, still-correct,
constant); and recharts' angled-tick collision model, which stays on its more
conservative projected-bounding-box approximation rather than the true
parallel-line perpendicular-separation constraint — a deliberate,
documented-in-code choice, not an oversight, given this change's scale (a
handful of buckets, not a rewrite of recharts' geometry).
