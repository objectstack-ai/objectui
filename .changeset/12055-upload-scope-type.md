---
'@object-ui/providers': minor
---

`createObjectStackUploadAdapter`'s `scope` option is typed from the spec's upload-scope vocabulary (objectui#12055).

`ObjectStackUploadAdapterOptions.scope` was an open `string`, so a caller could build an adapter with a scope the ObjectStack storage service refuses with `400`. It is now `UploadScope` from `@objectstack/spec/api`, the one list the spec's upload request, the `scope` select on `sys_file` and the upload doors share. `@object-ui/providers` reaches it through the `API` namespace `@object-ui/types` already re-exports, so no dependency and no export is added. Omitting `scope` still sends none, and the server applies the default the spec's upload request declares.

BREAKING (`@object-ui/providers`), TypeScript only, for a caller that builds the adapter with a scope outside the vocabulary (for example `'avatars'` or `'attachments/case'`): it no longer compiles. The server already refused such a request at runtime. Remedy: pass one of the vocabulary's values, or omit `scope` to take the server's default. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

**Clause-②: no (narrowing)**: the option's accepted values narrow from any string to the spec's upload scopes. No export, option or type member is added; the declaration file gains a type-only import of `API` from `@object-ui/types`, a package `@object-ui/providers` already depends on.
