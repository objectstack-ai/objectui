---
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
---

A record page no longer asks `POST /api/v1/security/explain` for a verdict nothing on screen uses (objectui#13045).

- **Record page header.** When the object's `userActions.edit` is the static `false`, the page does not ask the `update` verdict; `userActions.delete: false` likewise skips the `delete` verdict. Edit and Delete were already hidden by that `false`. A per-record predicate form, `true`, or an absent entry still asks, and Edit and Delete still follow the answer.
- **`DetailView`.** The record-level verdicts are asked only for a button the host shows: the `update` verdict when `showEdit` is set, the `delete` verdict when `showDelete` is set. The console record page's `record:details` body shows neither, so it no longer asks. A standalone `DetailView` with `showEdit` / `showDelete` asks as before, and its buttons follow the verdict.

On an object such as cloud's `sys_environment` (`userActions: { edit: false, delete: false }`), opening a record now sends no `security/explain` request. No export, prop or type member is added.
