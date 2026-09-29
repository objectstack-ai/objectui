---
'@object-ui/core': patch
'@object-ui/app-shell': patch
---

An unlabelled undoable action's Undo and Redo toast names the object and carries no English verb (objectui#11080).

- **The description no longer starts with a verb.** An `undoable` update whose action declared no `label` (or an empty one) described its operation as `Undo ` followed by the object's API name. The three places that build the operation now write the object identifier each already holds: `ActionRunner`, the console runtime's `api` handler and `RecordDetailView`'s `api` handler. An authored `label` still wins, byte for byte.
- **Why the verb goes.** The console's global Ctrl+Z / Ctrl+Shift+Z toasts already say Undo or Redo themselves, from the pack keys `actions.undoneOperation` and `actions.redoneOperation`. The fallback's own `Undo ` doubled that verb on the undo toast, and was wrong on the redo toast: under zh-CN they read 「撤销：Undo task」 and 「重做：Undo task」, and now read 「撤销：task」 and 「重做：task」. English reads `Undo: task` and `Redo: task`.
- **What does not change.** `UndoableOperation` is byte-identical, there is no new key, and `@object-ui/core` gains no text and no translator contract. The object is named by its API name in all three producers, not by its label.
- **No migration.** A stack restored from `objectui:undo-history` keeps the description it was saved with.

The fallback is reached only by an undoable action with an empty or missing `label`: `@objectstack/spec` requires an action to declare one, so in practice that is a code-built `ActionDef` or an authored empty label.
