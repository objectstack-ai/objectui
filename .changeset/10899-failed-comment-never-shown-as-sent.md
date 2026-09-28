---
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
'@object-ui/i18n': patch
---

fix(app-shell, plugin-detail): a record comment whose write fails is never shown as sent (objectui#10899)

The record page's discussion writers appended the new comment (or reply) to the
panel first and then fired the `sys_comment` create, swallowing its rejection.
On a tenant with no `sys_comment` the write answered 404 while the panel showed
the comment and a bumped count, with no error — and the comment was gone after a
reload.

`RecordDetailView` now appends a comment or reply only after its write resolves.
A failed write raises a localized error toast (`detail.commentFailed`, new in all
ten packs) and rejects back to the composer. The composers — the activity
timeline's comment box, the threaded reply input, and `RecordComments` — now
treat a rejected `onAddComment` / `onAddReply` explicitly as "not written": they
keep the draft for a retry instead of letting the rejection escape unhandled.
