---
'@object-ui/components': patch
---

The `element:*` blocks registered from `renderers/basic` draw their defaults in the page's language (objectui#12910, the close-out of objectui#12889). Each default reads `@object-ui/i18n` through `useObjectTranslation`, and an authored value still wins.

- **`element:record_picker`.** The closed control's prompt reads `lookup.selectRecord` ("Select record"; it read "Select a record…"). While it loads it reads `common.loading`, and after a failed read `list.loadErrorTitle` ("Couldn’t load records"; it read "Failed to load"). The empty line reads `common.noData` ("No data"; it read "No records"), the key `element:repeater` reads. The panel for an unresolvable `dataSource.view` reads `element.recordPicker.sourceUnresolved`. An authored `placeholder` or `emptyText` (a string, an inline locale map, or an empty string) still wins. A read that rejects with no message now shows the error state instead of the empty one.
- **`element:number`.** A rejection with no message shows `errors.unknown` ("An unexpected error occurred."; it read "aggregate failed"). A thrown message is still shown as thrown. The unresolvable-view panel reads `element.number.sourceUnresolved`.
- **`element:definition-list`.** The empty state reads `common.noData` ("No data"; it read "No details").
- **`element:image`.** With no `src`, the placeholder reads `element.image.noSource` ("No image source").
- **`element:metadata_viewer`.** Every line reads `element.metadataViewer.*`: the loading, failed, not-found and missing-key lines, the card titles, the state badges, the counts and the permission table header. Metadata names stay drawn as code chips, placed where each language's sentence puts them. Counts now read as "Steps: 3" and "Object access: 2", so no key needs a plural family.

The `placeholder`, `emptyText` and `items` input descriptions now name the bundle default instead of an English literal.

Clause-②: yes

The new `element.*` keys in `@object-ui/i18n` widen its exported `TranslationKeys`. No input, prop or export of this package changes.
