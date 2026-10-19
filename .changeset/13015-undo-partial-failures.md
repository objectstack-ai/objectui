---
'@object-ui/plugin-grid': patch
'@object-ui/types': minor
'@object-ui/i18n': minor
---

An import undo that leaves rows unreverted now says so in the Import Wizard (objectui#13015).

The undo route runs its reversal writes under the object's declared controls, so a hook or rule can refuse a row. The server then answers with `success: false` and one `failures` entry per row it did not revert. Each entry carries the app's own refusal sentence. The job stays undoable for exactly those rows. The wizard used to ignore the answer and only reported a thrown error, so a partial undo showed nothing.

- **Both lists that run Undo show it.** In the History list and on the cancelled-result screen, a partial answer reports how many rows were not undone and that undoing again retries only those rows. It lists each refusal sentence the answer carries. Rows refused with the same sentence share one line, and after ten distinct sentences the rest are counted. Undo stays offered, because the re-read job is still undoable. The object's open lists still refetch, because the undo reverted the other rows. A full undo is unchanged.
- **A thrown undo in the History list shows its message again.** The list's reload cleared the error slot the undo had just written to, in the same tick, so that message never appeared. The undo outcome now has a slot of its own.
- **`@object-ui/types`: `ImportJobUndoResult` is the spec's `UndoImportJobResponse`, bound by reference.** It was a hand-written copy that lacked `failures`. It now carries the required `failures` array of `{ id, action: 'delete' | 'restore', code, error }`. `@object-ui/types` now requires `@objectstack/spec` `^18.0.0-next.5`, the first published release that declares `failures`.
- **`@object-ui/i18n`:** the ten packs gain the `grid.import.undoPartial` count family.

BREAKING (`@object-ui/types`), for a custom `DataSource` whose `undoImportJob` resolves to the old shape: it must now return `failures` (an empty array for a full undo). `@object-ui/data-objectstack` already returns the server's answer unchanged. The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.

Clause-②: yes (narrowing): `ImportJobUndoResult`, exported from `@object-ui/types`, gains `failures`, and the new pack keys widen `@object-ui/i18n`'s `TranslationKeys` (the widening). `failures` is now required of a custom `DataSource`'s `undoImportJob` answer (the narrowing; see BREAKING above).
