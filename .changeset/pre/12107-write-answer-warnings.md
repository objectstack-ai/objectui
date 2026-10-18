---
"@object-ui/data-objectstack": minor
"@object-ui/app-shell": patch
"@object-ui/i18n": patch
---

Show a write answer's advisory `warnings` to the user after save (objectui#12107).

- `@object-ui/data-objectstack`: `WriteWarningEvent` gains an optional `warnings` member, typed by the spec's `ValidateDataIssue` (the element of `CreateDataResponseSchema` / `UpdateDataResponseSchema`'s `warnings`). A single-record `create` / `update` parses the answer's `warnings` through `ValidateDataIssueSchema` and emits the write-warning event when either `droppedFields` or `warnings` is non-empty; `droppedFields` stays required and is `[]` when the event exists only for warnings. An answer without the key emits nothing new, including from a runtime that predates it.
- `@object-ui/app-shell`: the write-warning toast shows each distinct warning message as the server wrote it, in its own toast titled by the new `detail.writeWarningsTitle` key. The stripped-fields toast is unchanged.
- `@object-ui/i18n`: adds `detail.writeWarningsTitle` to all ten packs.
