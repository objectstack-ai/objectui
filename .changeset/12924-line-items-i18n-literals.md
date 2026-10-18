---
'@object-ui/plugin-form': minor
'@object-ui/fields': patch
---

Line-item grids read a boolean column's options and a file cell's text in the session language (objectui#12924). Under a zh-CN session, a master-detail or `record:line_items` grid showed English in two places: the two options of a column derived from a `boolean` or `toggle` child field (`Yes` / `No`, in the editable picker and in the per-row form's list), and a file cell's text (`N files` for a cell holding several files, `File` for a file with no name). Both now come from the language packs, and English reads as before.

- **Boolean options.** The labels are the session's word for each value, from `useBooleanValueLabel` (`@object-ui/fields`), which reads `common.yes` / `common.no`, the keys read-only booleans already use. The stored values are unchanged: `'true'` and `'false'`. `MasterDetailForm` and `LineItemsPanel` call the hook and pass it to the derive functions. Both re-label the options when the session's words change, so a catalogue that lands after the child schema, or a language switch, reaches them without re-reading the lines.
- **File text.** `GridField` reads the count from `detail.fileCount`, the plural family the file cell renderer already uses, so each language gets its own plural forms (Russian `few` / `many`, for example). The name of a nameless file comes from `fields.file.fileFallback`. The per-row form's list cell and the read-only table both show these words.

No language-pack key is added.

BREAKING (`@object-ui/plugin-form`), for a caller of the exported `deriveDetail` or `deriveColumns`: both now require `booleanLabel`, a function that names a boolean value in the session language. Pass `useBooleanValueLabel()` from `@object-ui/fields`: `deriveDetail(childObject, childSchema, parentObjectName, { booleanLabel })`, and `deriveColumns(childSchema, { booleanLabel })`. There is no default, because an English default would label the options in English for a session in any other language. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

Clause-②: no (narrowing)
