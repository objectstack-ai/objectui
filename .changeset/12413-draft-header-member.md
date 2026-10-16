---
'@object-ui/data-objectstack': minor
'@object-ui/app-shell': patch
---

`MetadataDraftHeader`, the row type `MetadataClient.listDrafts()` declares, now declares `member` (objectui#12413).

`@objectstack/spec` declares `ListDraftsResponseSchema.drafts[].member`, an optional string, and `GET /meta/_drafts` serves it on every draft of a type whose identity is a pair (today `email_template`, `(name, locale)`). The published row type had no `member`, so a reader had to cast the row to reach it.

- **`@object-ui/data-objectstack`, additive widening.** `MetadataDraftHeader` is now derived from the spec row by `Pick` over `type`, `name`, `member`, `packageId`, `updatedAt` and `updatedBy`. The five keys it declared before keep their exact types; `member?: string` is the one key added. Nothing is removed or narrowed. `MetadataSaveAdvisoryEvent` gains an optional `member`, set by `publishDraft()` when the publish named one, so an advisory raised on one language's publish is attributed to that member. Every other door emits the event as before, without the key.
- **`@object-ui/app-shell`, no behaviour change.** The publish-all hook reads each draft row's `member` through the declared type instead of an `any[]` cast. The URLs it sends are unchanged.
