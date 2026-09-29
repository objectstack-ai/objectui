---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

The console's undo confirmation toast reads the session's language (objectui#11056).

- **The toast after Undo.** Pressing the Undo button on an undoable success toast used to raise a hard-coded English "Change undone", even where the button itself was already translated (objectui#10969). Both console undo handlers, in `useConsoleActionRuntime` and in `RecordDetailView`, now read the new `actions.undone` key through the translator each already holds. Under zh-CN the toast reads 「已撤销更改」.
- **English is unchanged.** The `en` value is `Change undone`, the same text as before.
- **The new key is in all ten packs.** de, es, fr, ja, ko, pt and ru word it as their own `navigationSync.undone` without the word for navigation; ar does the same and gives the noun its article. zh reads 「已撤销更改」, with the 撤销 of `actions.undo` and the 更改 of the pack's 「保存更改」.

`AppContent`'s own Ctrl+Z handler, which toasts `Undo: ` or `Redo: ` followed by the operation's description, is not changed here.
