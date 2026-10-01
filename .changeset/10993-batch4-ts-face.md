---
'@object-ui/types': minor
'@object-ui/plugin-detail': patch
---

Five label positions that `@objectstack/spec` types as `I18nLabel` now accept the per-locale map in `@object-ui/types` too, where they were typed `string` (objectui#10993, batch 4).

**What it was.** `I18nLabel` is a plain string or an inline per-locale map such as `{ en: 'Overview', 'zh-CN': '概览' }`. At these five positions the spec accepts the map and the renderer resolves it to the viewer's language, but `@object-ui/types` declared `string`, so a TypeScript author who wrote the spec's map got a compile error, and for `object-grid`'s `title` the published zod validator (`safeValidateSchema`) refused the map with `invalid_type` as well.

**What changed, in observable terms.**

- `RecordDetailsComponentProps.sections[].label`, `RecordRelatedListComponentProps.title`, `RecordRelatedListComponentProps.add.label` and `RecordPathComponentProps.stages[].label` are typed `I18nLabel`, the spec's own type, so the map compiles. A number is still a type error.
- `ObjectGridSchema.title`, the deprecated fallback for `label`, is `I18nLabel` on the TypeScript interface and in the zod mirror, which takes the spec's `I18nLabelSchema` by reference. The validator now accepts the map; a number, or a map entry that is not a string, is still refused at `title`. `label` still wins whenever it resolves to something.
- An `object-view`'s `table` slot takes `ObjectGridSchema`'s keys, so `table.title` accepts the map on both faces too. `ObjectView` hands it to the grid it draws, which shows the entry for the display locale.
- Rendering at these five positions does not change: each renderer already resolved the map. A plain string is accepted and rendered exactly as before.

**`record:related_list`, `columns[].label` (`@object-ui/plugin-detail`).** Since `@objectstack/spec` 17.5.0 a related list's `columns` may be column objects (`{ field, label, … }`, the saved-view shape), and a column's `label` is an `I18nLabel` too. A string label became the column header, but a per-locale map drew a blank header. `record:related_list` now resolves the map against the active UI language before it draws the list, so the header shows the viewer's entry; a string label, and a plain field-name column, render exactly as before.

**Clause-②: yes** — published `@object-ui/types` props types and one zod mirror member widen from `string` to the spec's `I18nLabel`, so the accepted set grows by the per-locale map at these positions. Nothing that was accepted before is refused now.
