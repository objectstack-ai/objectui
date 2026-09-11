---
'@object-ui/core': minor
---

A dataset-bound chart authored with an inline-locale-map `title` / `subtitle` /
`description` now draws its heading instead of drawing none (objectui#9038).

`@objectstack/spec` types `ChartConfigSchema.title` / `.subtitle` / `.description` as
`I18nLabel` — a plain string OR an inline locale map — so
`{ "chartConfig": { "title": { "zh-CN": "定价", "en": "Pricing" } } }` is authored
surface, not an accident. `chartConfigPresentation` lowered all three through a local
limb that admitted only a plain string, so the map arm returned `undefined`, the
`if (title)` guard skipped the assignment, and the key never reached the result. The
chart then drew **no heading at all**, in every language, with no diagnostic.

Note the shape of it, because it is not the sibling defect objectui#8943: the value was
not resolved badly, it was not resolved at all. There was no heading to compare against a
locale, so no locale-comparison check could see it, and an author who wrote spec-legal
metadata saw a chart that looked as though it had simply been given no title.

The three keys are now carried through **unresolved**, as the union the spec declares,
and resolved where the viewer is known:

- `normalizeChartSchema` (`@object-ui/plugin-charts`) already resolves exactly these
  three slots through `pickLocalized` against the language `ChartRenderer` reads from
  `useObjectTranslation()` (objectui#8943), and `ObjectChart` reads `schema.title`
  through the same resolver for its drill heading. Forwarding is what lets that
  resolver see the value; `pickLocalized` remains the one answer for the union.
- Resolving inside `@object-ui/core` was measured and is unavailable, not merely
  undesirable: `pickLocalized` lives in `@object-ui/i18n`, which DEPENDS on this
  package. Declaring the reverse edge makes the build graph cyclic — `turbo run build
  --filter=@object-ui/core` refuses with `Cyclic dependency detected` — and that
  package's entry point is a React provider plus hooks, which this package does not
  admit.
- No signature changed. `chartConfigPresentation(raw, fieldCategoryColors?)` takes the
  same two arguments, every existing caller compiles, and every key other than those
  three is byte-for-byte unchanged.
- The admission test did not widen. A plain string, or a record carrying at least one
  usable string entry — the same "is there anything here" question the old truthiness
  guard asked, extended to the map arm. A number, a boolean, an array, `''`, `{}` and a
  record with no string value are all still refused rather than stringified, because
  broadening what the renderer accepts belongs in the spec and not in a renderer-side
  coercion (AGENTS.md #0.1).

Two neighbouring cases stay unresolved on purpose and are now ledgered by name in the
source: a series `label` and an axis `title` still take `labelText`'s first-string-wins
pick (objectui#4020 — a locale-unaware choice a caller can override, which is a different
question from an erasure); and `plugin-report`'s `DatasetReportChart` paints the report
chart's own `h3` from a plain-string narrowing of `chart.title` of its own, so a
locale-map title still draws no heading on that surface. `subtitle` and `description` do
reach the chart there and are fixed by this change.
