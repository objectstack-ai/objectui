---
'@object-ui/core': minor
'@object-ui/plugin-dashboard': patch
---

fix(dashboard): a dashboard filter declaring `object` now resolves its translated labels; the axis-title half reaches no surface

`@objectstack/spec` declares two dashboard surfaces translatable — a filter's `object` and an
axis `title` — and the Console resolved neither, so an author could set a key the contract
documents and nothing happened. They turned out to be **two defects, not one** — a key never
read, and a value that bypassed a resolver already in the tree — and they were fixed
separately. Only the first reaches an author in this release: see the note at the end.

**1. `GlobalFilterSchema.object` was never read.** The spec's describe text for the key is
"Object whose `fields.<object>.<field>` translation-bundle entry resolves this filter's field
label and option labels". `resolveDashboardFilterDefs` names the keys it copies onto a
`DashboardFilterDef` and this one was not among them, so the authored value could not reach a
renderer even in principle: a dashboard filter declaring `object` and no `label`, viewed on a
translated console, painted the RAW FIELD NAME and left its option labels in the authored
English. The definition now carries `object` through, and `DashboardFilterBar` resolves the
field label through `useSafeFieldLabel().fieldLabel` and the option labels through the same
object's `translateOptions` — the convention resolver every list and form already calls, which
is the "one resolver path" the key's own spec text asks for. No second resolver was written.
Precedence follows that resolver's signature: the translator's bundle wins, the authored label
is the fallback. A filter that names no `object` never reaches it and renders exactly as
before.

**2. `ChartAxisSchema.title` bypassed a resolver two modules downstream.** The key is
`I18nLabel`, so an inline locale map parses, builds and validates — and `axisPresentation`
collapsed it with `labelText`, a first-string-in-KEY-ORDER pick. Measured both ways round on
one map: English to a `zh-CN` viewer and Chinese to an `en` viewer, decided by nothing but
which key the author typed first. `normalizeChartSchema` already resolves an axis title
through `pickLocalized` against the viewer's language, so the map only had to survive the
lowering. The fix forwarded it verbatim through `forwardedI18nLabel` — the neighbour in the
same module that already carries a chart's own `title` / `subtitle` / `description` for
exactly this reason — and that lowering was then removed in the same release (the note at the
end).

This moves one entry of the objectui#4020 first-string-wins ledger. That ledger's
justification is "a locale-unaware pick a caller can OVERRIDE", which holds for a series
`label` — the report renderer outranks it with objectui#4020's three-level display name — and
never held for an axis title, which is spread onto the chart schema and drawn. `seriesPresentation` keeps the pick and
is still pinned.

What an author sees change: a filter that opted in with `object` now shows its translated
field and option labels instead of the raw field name and English options. Nothing that omits
`object` renders differently, and point 2 changes nothing an author sees (below).

⚠️ Point 2 reaches no surface in this release, which also carries objectui#11315 and
objectui#11372. `@objectstack/spec` 17.5.0 refuses `chartConfig.xAxis` / `yAxis` / `series` on
a dashboard widget, and the dashboard's dataset widget no longer reads them (objectui#11315), so
a dashboard draws no authored axis title at all, in any language. That widget was the only
caller of `axisPresentation` and `mergeAuthoredPresentation`, and objectui#11372 removes both
from `@object-ui/core` in the same release, so the fixed lowering never ships. The react
`ObjectChart` tier, which still authors its own axes, never went through that lowering: it hands
`xAxis` / `yAxis` to `normalizeChartSchema`, which resolves a locale-map axis title against the
viewer's language since objectui#8943 (released alongside this, under its own changeset).
`ObjectChart.axisTitleLocale-10132.test.tsx` in `@object-ui/plugin-charts` pins that surface at
two languages.
