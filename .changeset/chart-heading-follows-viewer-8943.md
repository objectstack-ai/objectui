---
'@object-ui/plugin-charts': minor
---

A chart heading now follows the VIEWER's language instead of the author's key order
(objectui#8943).

`@objectstack/spec` types `ChartConfigSchema.title` as `I18nLabel` — a plain string OR
an inline locale map — so `{ "title": { "zh-CN": "定价", "en": "Pricing" } }` is authored
surface, not an accident. `normalizeChartSchema`'s module-local `label()` resolved the
map arm with `Object.values(v).find(isString)`: **the first string in key order**. It
never read the active language, never preferred `default` or `en`, and had no diagnostic
— the chart rendered confidently in whichever language the author happened to type first.
Reordering the JSON, with no other change, showed the same viewer a different language.

`label()` now delegates to `pickLocalized` (`@object-ui/i18n`), this repository's one
answer for that union: exact tag -> base language -> a region-qualified sibling ->
`default` -> `en` -> first value, pinned as the twin of the backend's `resolveI18nLabel`.
The drill-drawer heading in the same component already routed through it, so `ObjectChart`
had two answers for one union on one node; it now has one.

Every `I18nLabel` slot this module resolves is covered, not only the heading: `title`,
`subtitle`, `description`, an axis `title` (`normalizeAxis`) and a series `label`
(`normalizeSeries`).

- `normalizeChartSchema(schema, language?)` takes an OPTIONAL second argument — the
  viewer's active language. Every existing call compiles and every non-label key is
  byte-for-byte unchanged. `ChartRenderer` reads it from `useObjectTranslation()` and
  passes it down, which is what closes the defect on the rendered path.
- Omitting it is not neutral: `pickLocalized` reads an absent language as `en`, so a
  locale map resolves through `default` -> `en` -> first value. That is deterministic
  rather than key-order-dependent, and it is the right answer only for a caller with no
  viewer. A caller that reads a heading off the result should pass one.
- The admission test did not widen. Only a string or an inline locale map is accepted;
  a number or boolean `title` is still refused rather than stringified, because
  broadening what the renderer accepts belongs in the spec and not in a renderer-side
  coercion (AGENTS.md #0.1).
