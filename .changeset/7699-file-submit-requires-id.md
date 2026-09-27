---
'@object-ui/fields': patch
'@object-ui/i18n': patch
---

fix(fields): a file or image upload that surfaces no `sys_file` id is refused by name, never submitted as an inline blob

`Clause-②: yes (narrowing)` — `fileValueForSubmit`, a public export of `@object-ui/fields`, narrows its return type to `string` and throws where it used to return an object; `UploadIncompleteError` is a new public export. No field-value accept set widens.

`fileValueForSubmit` used to fall back to the legacy inline `{ name, original_name, size, mime_type, url }` object when the upload adapter surfaced no `meta.fileId`. That was the one client path still producing the pre-D3 file value: the backend's stored contract has been the bare `sys_file` id since spec `17.0.0`, so the fallback turned a successful-looking upload into a save the engine refused (`invalid_type`) on every deployment that has verified its file-as-reference migration, and into a warned-about legacy value on the rest. ADR-0104's 2026-09-05 addendum fixes the physical column to the bare id as well.

The fallback is retired. `FileField`, `FileCell` and both upload paths of `ImageField` now submit the id the adapter minted, or refuse the pick with the translated `fields.file.uploadIncomplete` message ("did not complete") in the same error row a transport failure lands in — the field is not changed and no blob reaches `onChange`. This includes the object-URL default `useUpload()` falls open to when no `UploadProvider` is mounted, and any S3/Azure-style adapter that mints no `sys_file` row. Reading is unchanged: a legacy blob already on a record still renders, and on a `multiple` field it is passed through untouched beside a new id.

`@object-ui/i18n` gains the `fields.file.uploadIncomplete` key in every locale pack.
