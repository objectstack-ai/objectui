---
'@object-ui/core': patch
'@object-ui/plugin-dashboard': patch
---

fix(dashboard,charts): two dashboard surfaces the spec types as translatable now resolve (objectui#10132)

`@objectstack/spec` declares both of these translatable and the Console resolved neither, so
an author could set a key the contract documents and nothing happened. They turned out to be
**two defects, not one** — a key never read, and a value that bypassed a resolver already in
the tree — and they are fixed separately.

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
lowering. It now travels verbatim through `forwardedI18nLabel` — the neighbour in the same
module that already carries a chart's own `title` / `subtitle` / `description` for exactly
this reason.

This moves one entry of the objectui#4020 first-string-wins ledger. That ledger's
justification is "a locale-unaware pick a caller can OVERRIDE", which holds for a series
`label` — `DatasetWidget` replaces it from the locale bundle — and never held for an axis
title, which is spread onto the chart schema and drawn. `seriesPresentation` keeps the pick and
is still pinned.

What an author sees change: a filter that opted in with `object` now shows its translated
field and option labels instead of the raw field name and English options; an axis title
authored as a locale map now follows the viewer's language instead of the author's key order.
Nothing that omits `object` or authors a plain-string axis title renders differently.
