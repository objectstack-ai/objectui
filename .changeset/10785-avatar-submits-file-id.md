---
'@object-ui/fields': minor
---

fix(fields): an avatar pick uploads through the `UploadProvider` and submits its `sys_file` id, or is refused by name — never stored as a `data:` URL

**BREAKING (`@object-ui/fields`), graded `minor` by this repo's release model** (AGENTS.md: objectui's major follows the `@objectstack` family major, so its own breaking changes ship as `minor` with the breaking semantics stated here, never `major`), the grade objectui#7699 gave the same change to the file and image widgets:

- **Who breaks.** A host that renders `AvatarField` under an upload adapter whose result carries no id-shaped `meta.fileId`. That includes the object-URL default: `useUpload()` falls back to it when no `UploadProvider` is mounted, and `UploadProvider` uses it when given no `adapter`. It also includes any S3- or Azure-style adapter, `createS3Adapter` and `createAzureBlobAdapter` among them, because neither mints a `sys_file` row. Such a host used to get a `data:` URL in `onChange` for every pick.
- **What they see now.** The pick is refused with the translated "did not complete" row `FileField` and `ImageField` render for the same pick, and the field is not changed.
- **What to do.** Mount an `UploadProvider` whose adapter returns the `sys_file` id in `meta.fileId`. `createObjectStackUploadAdapter`, the ObjectStack presigned flow, does. A host on another backend returns its own file id there (word characters and `-`, 1 to 64 long, as `isFileIdToken` requires) and has its read path return `{ id, name, url }`, because a bare id otherwise renders from ObjectStack's `/api/v1/storage/files/:id`.

`avatar` is a member of the file-reference family, so its stored value has been the bare `sys_file` id since spec `17.0.0`. `AvatarField` read the picked file with `FileReader.readAsDataURL` and stored the resulting `data:` URL instead: the whole image inlined into the record row, as a value the engine refuses (`invalid_type`) on every deployment whose `adr-0104-file-references` flag is recorded and admits only warn-first on the rest.

The pick now goes through `useUpload()` and `fileValueForSubmit`, the path the file and image widgets use: the id reaches `onChange`, and the preview shows the upload's own URL until the next read expands the value. While the upload runs, the button shows the uploading state and the widget reports it through `onUploadingChange` and the ambient uploading scope, as the file and image widgets do, so a form save waits for it. Reading is unchanged for a legacy `data:` or http(s) URL already on a record, which still renders as itself, and a bare id now renders from the storage endpoint instead of as a relative `src`.
