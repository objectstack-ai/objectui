---
'@object-ui/types': minor
---

`objectui validate` accepts `record:approvals` and `record:attachments` (objectui#12363). `@objectstack/spec` 18 declares both page blocks, `@object-ui/app-shell` renders both, and the default record page `buildDefaultPageSchema` builds emits both, but `AnyComponentSchema` had no arm for either, so the validator refused each at `type`.

- **Armed.** `RecordApprovalsBlockSchema` and `RecordAttachmentsBlockSchema` (zod, from `@object-ui/types/zod`) and their TypeScript twins of the same names (from `@object-ui/types`) are new, and `AnyComponentSchema` gains both arms, so `safeValidateSchema` and the strict face accept the two nodes.
- **What each accepts.** Each `properties` bag restates the spec's empty strict `ComponentPropsMap` row, because the spec exports neither row under a name: the only bag accepted is `{}`. Any key in the bag is refused, including `approvals` and `currentUserId`, which the spec's `record:approvals` row names as the host's runtime channels. A node-level `children` or `body` is refused by name.
