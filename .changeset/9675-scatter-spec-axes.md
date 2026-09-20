---
'@object-ui/plugin-charts': minor
---

A scatter's two numeric axes now honour the spec `ChartAxis` every other chart
family already honours, instead of dropping it.

`min` / `max` / `stepSize` / `logarithmic` / `title` / `format` written on a
chart's `xAxis` or `yAxis` were accepted by the schema and resolved by
`normalizeChartSchema`, and then the scatter branch — alone among the families —
never handed them to its axes. An author who pinned `min: 0` to stop a
truncated-baseline reading got the truncated baseline back; a `logarithmic` axis
rendered linear; explicit `stepSize` ticks and an axis `title` never appeared.
Nothing refused and nothing looked broken: the chart drew confidently, at a scale
the author had overridden.

**This is a user-visible render change.** A scatter that already declared any of
those keys will now draw at the domain, tick spacing, scale and labelling it
asked for rather than at recharts' auto-fitted ones. A scatter that declares no
axis config renders exactly as before — the derivation contributes no prop when
there is no axis to derive from.

Both axes are covered, not just the y the report named: scatter is this
renderer's only family whose x is a numeric MEASURE rather than a category band,
so it is the only one where these keys mean anything on x, and it was dropping
them there too.

The repair composes with the scatter edge margin rather than shadowing it. That
margin is spent as recharts' axis `padding`, which insets the pixel range and
leaves the domain alone, so an authored domain and the margin are now live at
once — the domain is the author's, and no extreme mark is half-painted outside
the plot box. A pin holds that pair together.

No new key, no new exported symbol: the derivation the other families use is now
shared by both orientations, and the scatter axes spread it.
