---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

Show the environment admin a storage-capacity banner from the tenant runtime's own
storage verdict (objectui#10439, the objectui half of cloud#2135).

`GET /api/v1/usage/storage` already served the verdict the upload and bulk-import
guardrail refuses with (`warn` from 80%, `blocked` at 100%) and the two figures
`usedMb` / `limitMb`. Nothing in the console rendered them, so an environment could
fill up with no warning and learn it was full only when an upload failed.

- **`warn`**: a banner with the used and limit figures, for example "850 MB of
  1,024 MB used".
- **`blocked`**: the banner says storage is full and uploads and imports are paused,
  that existing data is untouched, and links to the control plane to upgrade. The link
  is left out on a runtime that names no upstream cloud.
- **Anything else** (`ok`, `unknown`, `unlimited`, an endpoint that cannot be read or
  answers off-contract) renders nothing.

The banner reads the served verdict. It never compares the figures with each other or
with a threshold, so it shows what the guardrail enforces. It is mounted in
`ConsoleShell` beside the read-rate report and has the same audience: only a workspace
admin sees it, and only a workspace admin's session issues the request. The two
banners share one request to the endpoint. Neither banner is exported from the package
entry.

`@object-ui/i18n` gains the five `console.storageUsage.*` keys in all ten locale packs.
