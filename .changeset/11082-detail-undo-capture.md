---
'@object-ui/core': minor
'@object-ui/app-shell': patch
---

fix(app-shell,core): the record page's Undo captures only what the record carries, through core's one capture rule (objectui#11082)

**Clause-②: yes** — `captureUpdateUndoData` becomes a named export of `@object-ui/core`, a new published symbol. Its answers do not change. No declared type or accepted key moves.

- **`@object-ui/core` exports `captureUpdateUndoData(writtenFields, rowRecord)`.** It is the rule `ActionRunner` already used for an `undoable` update's Undo snapshot (objectui#10404): it answers each written field's stored value when the row carries every written field, and `undefined` when any one is missing, so the caller offers no Undo at all. A `null` the row carries is captured as `null`. "Carries" means an own key whose value is not `undefined`.
- **The record page's own `api` handler calls it.** `RecordDetailView` read each written field's prior value off the loaded page record as `pageRecord[k] ?? null`. The page record is read with no column list, but the server removes every field the reader may not read, so an undoable action that writes such a field found it absent and captured `null`. Pressing Undo then wrote `null` over the stored value. Now that action offers no Undo button, logs a warning naming the missing fields, and still performs the write. A carried value, `null` included, is restored as before.
- **The console runtime's `api` handler calls it too**, in place of its inline copy of the same rule. Its behaviour does not change.

Pinned in `packages/app-shell/src/views/RecordDetailView.undoCapture-11082.test.tsx` and `packages/core/src/actions/__tests__/captureUpdateUndoData.export-11082.test.ts`.
