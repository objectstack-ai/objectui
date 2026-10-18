---
'@object-ui/plugin-designer': minor
---

The result type of `useConfirmDialog` is declared as `DesignerConfirmDialogState` instead of `ConfirmDialogState` (objectui#6349, batch 6). `@object-ui/app-shell` declares an unrelated `ConfirmDialogState` (the data its action-confirm dialog renders, with the promise's resolver), and one exported name has one declaration.

**Breaking-change note.** Nothing breaks for a consumer of this package: the package entry never exported `ConfirmDialogState`, so no import named it, and the hook's result keeps the same members (`isOpen`, `title`, `message`, `confirm`, `onConfirm`, `onCancel`). Only the type name shown in the published declaration of `useConfirmDialog` changes. `ReturnType<typeof useConfirmDialog>` resolves to the same shape as before.

No runtime behaviour changes.
