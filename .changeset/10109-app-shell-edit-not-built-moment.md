---
'@object-ui/app-shell': patch
---

When the AI chat receives an incremental edit, it no longer switches to the Studio workbench as if a whole-app build had finished. The built-moment transition also checks the draft review, and it now skips one that says `kind: 'edit'`, even when the edit re-staged the `app` artifact (objectui#10109). The chat's local message cache also keeps that `kind` when it rebuilds the draft envelope, so an edit reloaded from the cache still reads as an edit. An `apply_blueprint` build, which carries no `kind`, moves to Studio as before.
