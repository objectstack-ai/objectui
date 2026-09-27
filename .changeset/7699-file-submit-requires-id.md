---
'@object-ui/fields': minor
'@object-ui/i18n': patch
---

fix(fields): a file or image upload that surfaces no `sys_file` id is refused by name, never submitted as an inline blob

**BREAKING (`@object-ui/fields`), graded `minor` by this repo's release model** (AGENTS.md: objectui's major follows the `@objectstack` family major, so its own breaking changes ship as `minor` with the breaking semantics stated here, never `major`):

- **Who breaks.** Two kinds of host. The first calls `fileValueForSubmit` itself. The second mounts an upload adapter whose result carries no `meta.fileId`. That includes the object-URL default: `useUpload()` falls back to it when no `UploadProvider` is mounted, and `UploadProvider` uses it when given no `adapter`. It also includes any S3- or Azure-style adapter, `createS3Adapter` and `createAzureBlobAdapter` among them, because neither mints a `sys_file` row.
- **What they see now.** `fileValueForSubmit` throws `UploadIncompleteError` (`code` `UPLOAD_INCOMPLETE`, `fileName` naming the pick) where it used to return the inline object, and its return type is `string`. In `FileField`, `FileCell` and `ImageField` the pick is refused with the translated "did not complete" row, and the field is not changed.
- **What to do.** Mount an `UploadProvider` whose adapter returns the `sys_file` id in `meta.fileId`. `createObjectStackUploadAdapter`, the ObjectStack presigned flow, does. A custom adapter has to register the file with the platform and return that id. A host that calls `fileValueForSubmit` directly catches `UploadIncompleteError` (or checks `code === 'UPLOAD_INCOMPLETE'`) where it used to accept an object.

`Clause-②: yes (narrowing)` — `fileValueForSubmit`, a public export of `@object-ui/fields`, narrows its return type to `string` and throws where it used to return an object; `UploadIncompleteError` is a new public export. No field-value accept set widens.

`fileValueForSubmit` used to fall back to the legacy inline `{ name, original_name, size, mime_type, url }` object when the upload adapter surfaced no `meta.fileId`. That was the one client path still producing the pre-D3 file value: the backend's stored contract has been the bare `sys_file` id since spec `17.0.0`, so the fallback turned a successful-looking upload into a save the engine refused (`invalid_type`) on every deployment that has verified its file-as-reference migration, and into a warned-about legacy value on the rest. ADR-0104's 2026-09-05 addendum fixes the physical column to the bare id as well.

The fallback is retired. `FileField`, `FileCell` and both upload paths of `ImageField` now submit the id the adapter minted, or refuse the pick with the translated `fields.file.uploadIncomplete` message ("did not complete") in the same error row a transport failure lands in — the field is not changed and no blob reaches `onChange`. This includes the object-URL default `useUpload()` falls open to when no `UploadProvider` is mounted, and any S3/Azure-style adapter that mints no `sys_file` row. Reading is unchanged: a legacy blob already on a record still renders, and on a `multiple` field it is passed through untouched beside a new id.

`@object-ui/i18n` gains the `fields.file.uploadIncomplete` key in every locale pack.
