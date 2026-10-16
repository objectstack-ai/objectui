---
"@object-ui/plugin-grid": patch
---

fix(plugin-grid): a list column's inline locale-map `label` now heads the column (objectui#12358)

`ListColumnSchema.label` is the spec's `I18nLabel`, a plain string or an inline
per-locale map such as `{ en: 'Amount', 'zh-CN': '金额' }`. The grid kept only a
plain string, so a map label was dropped and the header fell back to the field
label in every language. The map is now picked by `pickLocalized` against the
viewer's UI language, with that resolver's own floor when the viewer's locale
is absent. A plain-string label renders unchanged. The CSV export and the
inline-edit conflict dialog read the same resolved header.
