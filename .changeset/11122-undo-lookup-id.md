---
'@object-ui/core': patch
'@object-ui/app-shell': patch
---

fix(core,app-shell): Undo of a lookup update restores the stored id, not the expanded record (objectui#11122)

**Clause-②: no** — no authorable key, schema or prop moves. `captureUpdateUndoData` gains a required third argument, the written object's field definitions; the function's export is still unreleased (it ships with the pending objectui#11082 changeset), so no published version carries the two-argument form. `ActionContext` declares no new member: the runner reads `objectFields` through the interface's existing open index signature, the way it already reads `objectName`.

- **A relation's Undo value is the id it stores.** Surfaces read rows with `$expand` on the relations they show, and the server puts the related record where the id was. The Undo snapshot copied that record, so Undo wrote `{ id: 'a1', name: 'Acme' }` into a lookup that stores `'a1'`: refused under a strict value-shape posture, stored as corruption under the lenient one. `captureUpdateUndoData(writtenFields, rowRecord, fields)` now captures a field the object declares relational (`lookup`, `master_detail`, `user`, `tree`) as its id, and a `multiple` one as its array of ids. It uses `toPredicateRecord`, the rule that already binds a fetched record to its stored ids for predicates, so the two cannot disagree about which fields are relations.
- **Read from the field definitions, never from the value's shape.** A `json` field holding an object with an `id` is captured, and restored, exactly as the record carries it. Called with `undefined` for `fields`, nothing is treated as a relation.
- **All three writers pass the definitions.** The console runtime's `api` handler looks up the written object in its `objects` and then in the console's metadata store. The record page passes its object's fields. `ActionRunner`'s `operation: 'update'` reads `objectFields` from the action context, where the console runtime and the record page now publish their object's field definitions beside `objectName`; it uses them only for that object.

Pinned in `packages/core/src/actions/__tests__/captureUpdateUndoData.relations-11122.test.ts`, `packages/app-shell/src/views/RecordDetailView.undoLookupId-11122.test.tsx` and `packages/app-shell/src/hooks/__tests__/useConsoleActionRuntime.undoLookupId-11122.test.tsx`.
