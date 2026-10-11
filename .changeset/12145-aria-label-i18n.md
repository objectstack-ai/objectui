---
'@object-ui/i18n': minor
'@object-ui/plugin-chatbot': minor
'@object-ui/components': patch
'@object-ui/fields': patch
'@object-ui/app-shell': patch
'@object-ui/plugin-designer': patch
'@object-ui/plugin-detail': patch
'@object-ui/plugin-grid': patch
'@object-ui/plugin-list': patch
'@object-ui/console': patch
---

Screen readers hear the names of more controls in the viewer's language (objectui#12145).

These controls carried an English `aria-label`, so under a non-English locale a screen reader announced their names in English: the docs portal's loading spinner, the record form page's breadcrumb, the `Spinner` status region, a data table's row menu button, the `pagination` renderer's previous and next links, the image crop preview, the percent slider, the record picker's grid, the AI composer's send and stop button and an attachment's remove button, the designer's undo and redo buttons, minimap, version history and back button, a dismissible record alert's close button, the bulk-action bar, and the mobile view switcher. Each name now comes from the language packs. English names are unchanged, with two small exceptions: the spinner now reads "Loading…", and the pagination links read "Previous page" and "Next page", the same words the data table pager uses. Sighted use is unchanged.

Added: eight language-pack keys in all ten packs: `help.loadingDocumentation`, `common.breadcrumb`, `table.rowActions`, `fields.image.cropPreview`, `fields.percent.slider`, `designer.canvasMinimap`, `designer.versionHistory` and `grid.bulkActions`. Every other name reuses a key that already holds the same words. The exported `en` pack, and so `TranslationKeys`, gains these eight members. `PromptInputAttachment` (exported through `AIElements`) takes an optional `removeLabel` prop that names its remove button; without it the button keeps its English name.
