---
'@object-ui/data-objectstack': minor
'@object-ui/app-shell': patch
---

"Publish all" publishes each language of a package-less email template by its own bundle member (objectui#12402, the publish half of objectui#12271).

Since `@objectstack/spec` 18.0.0-next.1 each `GET /meta/_drafts` row carries `member` for a type whose identity is a pair (today only `email_template`, `(name, locale)`), and the by-name publish door reads it back as `?member=`. A publish that names no member promotes the canonical member's draft, so two languages of one template drafted outside a package were published as the canonical one twice.

- **`MetadataClient.publishDraft(type, name, options?)`** takes an optional `{ member }` and sends `?member=` when it is set. Without one the parameter is omitted, never sent empty. This widens the method's accepted arguments; a two-argument call sends exactly the request it sent before.
- **`usePublishAllDrafts`** (Home's "Publish all" and the draft-preview bar) keeps each draft row's `member` and passes it on the package-less path. Rows without a member send no selector.
- **Unchanged:** package-bound drafts still publish through `publishPackageDrafts(packageId)`.
