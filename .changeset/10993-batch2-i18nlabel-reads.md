---
'@object-ui/plugin-detail': minor
'@object-ui/plugin-dashboard': minor
'@object-ui/plugin-grid': minor
---

A `record:path` whose stage labels are per-locale maps now shows the viewer's language instead of failing to render, and five label inputs on `object-metric`, `object-grid` and `record:related_list` now accept the per-locale map their renderers already resolve (objectui#10993, batch 2).

**`record:path`, `stages[].label`.** `@objectstack/spec` types each stage's `label` as `I18nLabel`: a plain string or an inline per-locale map such as `{ en: 'Draft', 'zh-CN': '草稿' }`. `RecordPathRenderer` read it raw, as the stage's visible text and inside the stage's accessible name, so a map threw "Objects are not valid as a React child" and the node rendered `Component "record:path" failed to render` instead of the path. It now resolves each map with `pickLocalized` against the active UI language (`useObjectTranslation().language`) before the stages are translated, classified or drawn:

- Both rows (desktop and mobile) paint the entry for the viewer's language, and each stage's accessible name carries the same text beside its state words, in one language.
- A stage with no `terminal` is still classified from its label: a lost stage whose label is a map (for example `{ en: 'Closed Lost', 'zh-CN': '丢单' }`) still reads as lost.
- A plain string renders exactly as authored. A picklist translation of the status field still outranks the authored label, as it did for a string.

**The registry inputs.** These inputs declared `type: 'string'` only, while their renderers already resolve a per-locale map, so the manifest built from `ComponentRegistry.getPublicConfigs()` made `validateTree` report `type-mismatch` on a map the spec accepts. Each now declares both arms, `type: ['string', 'object']`, with a description that teaches the map:

- `@object-ui/plugin-dashboard`: `object-metric`'s `label` (the tile heading), `description` (the sub-caption under the value) and `title` (the drill-down panel heading), resolved against the active UI language.
- `@object-ui/plugin-grid`: `object-grid`'s `label` (the table caption, the export title and the record-detail overlay heading), resolved against the display locale: the workspace's regional default when one is configured, otherwise the active UI language. `view:grid` registers the same inputs, so its declared `label` carries the same two arms.
- `@object-ui/plugin-detail`: `record:related_list`'s `title` (the list heading), resolved against the active UI language.

A value that matches neither arm, such as a number, is still reported. No renderer changes for these five: each already resolved the map.

**Not in this batch.** `object-grid`'s deprecated `title`, read when `label` is absent, still renders a map raw; it follows in a later batch.

**Clause-②: yes** — five published registry inputs widen from `'string'` to `['string', 'object']`, so `validateTree` accepts a locale map on them (and `view:grid`'s `label`, which shares `object-grid`'s inputs, declares the same arms). Nothing that was accepted before is refused now.
