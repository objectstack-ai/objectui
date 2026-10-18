---
'@object-ui/fields': patch
---

A `composite` or `record` field value reads as labelled sub-values, not as its stored JSON (objectui#11697). On the record page, and in every grid cell that draws from the same cell-renderer table, a composite value such as `{"width":10,"height":20}` showed as raw JSON in a monospace face. It now reads `Width 10 · Height 20`. A record value reads one labelled group per entry name, so `{ primary: { name: "A", score: 9 }, backup: { name: "B", score: 7 } }` reads `Primary (Name A · Score 9) · Backup (Name B · Score 7)`. A record entry that is not a sub-object reads as a pair.

- **Labels** are the humanized key. The field metadata has no sub-field declaration to read one from: `@objectstack/spec`'s field schema declares none for these types and refuses `fields` / `subFields` as unrecognized keys.
- **Sub-values.** A number is formatted as the number cell formats a field with no declared `scale`, and a boolean reads as Yes / No in the reader's language. A string reads as itself and an unset sub-value as the shared "No value" dash. An object or array nested inside a sub-value stays compact JSON.
- **One line.** The value is one truncated line in the grid, on the record page and in the summary chip, with the full text in its `title`. It is a description list, so a screen reader reads term and value pairs.
- **Unchanged.** An empty value, `[]`, `{}` and a non-object value read exactly as the JSON cell reads them, and a string holding JSON is never parsed. `json` and `object` keep the JSON cell. The record page's copy button still copies the stored JSON.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new renderer is module-local and is reached through `getCellRenderer('composite')` and `getCellRenderer('record')`.
