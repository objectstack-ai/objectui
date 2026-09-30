---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

The console's global Undo and Redo toasts read the session's language (objectui#11080).

- **The Ctrl+Z / Ctrl+Shift+Z toasts.** `AppContent`'s `useGlobalUndo` handlers used to raise `Undo: ` or `Redo: ` in English before the operation's description, under every language. They now read two new keys, `actions.undoneOperation` and `actions.redoneOperation`, through the translator `AppContent` already holds. The operation's description is interpolated unchanged, so the pack owns the words and their order. Under zh-CN the toasts read 「撤销：…」 and 「重做：…」.
- **English is unchanged.** The `en` values are `Undo: {{description}}` and `Redo: {{description}}`, the same text as before.
- **The new keys are in all ten packs.** Each pack words them with its own `actions.undo` and its own word for Redo, followed by its usual colon: full-width in zh, and a space before the colon in fr.

The description of an operation whose action declared no `label` is still built in English by its producer. That half of objectui#11080 is not changed here.
