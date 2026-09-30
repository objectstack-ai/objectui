---
'@object-ui/app-shell': patch
'@object-ui/components': patch
'@object-ui/console': patch
---

fix(app-shell,components,console): the three remaining select placeholders show the locale's own "Select…" word (objectui#11252)

Three selects with no value fell back to a hard-coded English `Select…`, so they read English under every locale, beside otherwise localized copy:

- Studio's datasource dialog (`DatasourceResourcePage`): an `enum` property in a driver's config form with no value, such as the Turso driver's optional `mode`. It now shows Studio's own `engine.form.selectEllipsis`, the word Studio's other enum selects already show, in the designer's language.
- `ConfigFieldRenderer` in `@object-ui/components`: a `select` field with no `placeholder`. It now reads the shared `common.select` key. A host with no `I18nProvider` still sees `Select…`, never the raw key. An author-supplied `placeholder` still renders verbatim.
- The console settings page (`SettingsField`): a closed `select` with no value. It now reads `common.select`, with `Select…` as the en default.

The en text is unchanged at all three. No locale key was added.
