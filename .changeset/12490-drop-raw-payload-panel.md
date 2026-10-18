---
'@object-ui/console': patch
'@object-ui/i18n': minor
---

The Approval Center's request drawer no longer has a "Raw data (JSON)" panel, for any viewer (objectui#12490).

The drawer used to end with a collapsed panel that printed the submitted record's whole snapshot as JSON, with a copy button, shown only to holders of the platform-admin-only `studio.access` capability. There is no business need for it: the person handling an approval decides from the structured summary, the approval chain, the activity and the actions, and all of those are unchanged. The panel is now removed for everyone, platform operators included, and nothing replaces it. The served approval request page never had such a panel.

Clause-②: no (narrowing) — the four keys `approvalsInbox.rawData`, `approvalsInbox.copy`, `approvalsInbox.copied` and `approvalsInbox.copyFailed` leave all ten locale packs, and nothing is added.

`@object-ui/i18n` (BREAKING; `minor` under this repository's release model, where objectui's major follows the `@objectstack` major): the exported `en` pack and the `TranslationKeys` type derived from it lose those four members. Nothing in objectui reads them now. A host that calls `t()` with one of them gets the key back; supply the string from your own resources if you still need it. Keys with the same leaf name in other namespaces are not affected.
