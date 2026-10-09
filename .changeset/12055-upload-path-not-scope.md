---
'@object-ui/providers': minor
---

`createObjectStackUploadAdapter` no longer sends an upload's `path` as the storage scope (objectui#12055).

The adapter used to send `scope: opts.scope ?? options.path` in its presigned upload request, so an adapter built without a `scope` turned the `path` a caller passed to `upload(file, { path })` into the scope. A path is a key prefix for the S3 and Azure presign callbacks, not a scope: the ObjectStack storage service accepts only the values of the `scope` select on its `sys_file` object and refuses any other, so such an upload failed at the presign step. The adapter now sends only the `scope` it was built with, or none, and the server applies its default. `UploadResult.meta.scope` reports the same value.

The `scope` option's documentation no longer teaches free key prefixes ("avatars", "logos", "attachments/case"). It names the server's `sys_file` scope select as the vocabulary. The option's type is unchanged (`string`).

BREAKING (`@object-ui/providers`), for a caller that relied on `path` to choose the scope of an adapter built without one: the upload is now filed under the server's default scope. Remedy: pass one of the server's scopes as the adapter's `scope`, or none to take the server's default. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

**Clause-②: no (narrowing)**: no export, type member or option is added, and no type changes. The request the adapter sends narrows: a `path` no longer reaches it.
