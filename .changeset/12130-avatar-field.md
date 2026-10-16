---
'@object-ui/types': minor
---

A form field declares `avatarField`, the record field each candidate of the search picker draws its avatar from, on both faces, so the strict authoring face stops telling authors to remove a key that works (objectui#12130).

The `lookup` and `user` field widgets (and `master_detail`, which renders through the `lookup` widget) read `avatarField` off a `form`'s `fields[]` entry. With `picker: 'search'`, each candidate row draws its avatar from that record field instead of `image`. This is measured through the real `SchemaRenderer`, with and without the key, in `form-field-channel-effects-12130.test.tsx` in `examples/schema-catalog/test/`. The census beside it now lists `avatarField` as declared and read by those three types.

- **Declared as the widgets read it:** `avatarField` (`string`, default `image`). The spec's `FieldSchema` declares neither spelling, so this is the face's own declaration, typed like `defaultName`.
- **TypeScript.** `FormField` gains the member. It used to fall to the index signature's `any`, so a typed literal with a non-string value is now a compile error.
- **zod (`@object-ui/types/zod`).** WIDENS on the strict authoring face (`StrictAnyComponentSchema`): `avatarField` used to be refused with `unrecognized_keys`, and now parses. NARROWS on the tolerant face (`safeValidateSchema`), where the key used to be stripped unjudged: a non-string value is now refused, and a string is now kept. The face is flat: the key is accepted on every field type, and only the widgets named above read it.
- **Still refused, by name:** `avatar_field`, the snake_case spelling the widgets read first. The face declares one spelling, camelCase like its other field keys, and the census ledger now lists `avatar_field` with the other second spellings (`allow_create`, `lookup_columns`, `lookup_page_size`, `reference_field`). `UserFieldMetadata` still declares `avatar_field`; that spelling's retirement is objectui#12157's.

BREAKING (`@object-ui/types`), for a document whose form field carries `avatarField` with a non-string value: it no longer validates on the tolerant face. Fix the value. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

**Clause-②: yes (widening)**: the declared key widens the strict face's accept set, and its value check narrows the tolerant face.
