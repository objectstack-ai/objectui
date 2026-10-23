---
'@object-ui/types': patch
'@object-ui/plugin-grid': patch
---

The bulk action confirm step reads `confirmText` as a string or as a `{ dialect: 'template', source }` envelope (objectui#13183).

`@objectstack/spec` is making a bulk action's `confirmText` a `template` slot (objectstack#24947), so a parsed bulk definition serves the envelope where it served a string. The confirm step rendered `confirmText` as it came, so an envelope would have broken it. It now shows the string, or the envelope's `source` as written; a blank or absent value still shows the default sentence ("This will apply to N record(s)."). `{{ }}` holes are not filled yet: `{{ count }}` still shows as written. `BulkActionDef.confirmText` in `@object-ui/types` is typed `string | { dialect?: 'template'; source: string }`, and `@object-ui/plugin-grid` reads it through one helper, `bulkConfirmTextSource`.
