---
'@object-ui/components': minor
'@object-ui/types': patch
---

`action:button` delivers `undoable` where a record is in scope, and publishes it (objectui#11168, ruling B on objectui#11754).

An `action:button` that declares `undoable: true` on an `operation: update` now offers Undo in its success toast. Undo writes back the prior values of the fields the update wrote, read off the record in scope: the record page's record, or the row the host binds to the node through `data` (a table's row, `DetailView`'s header, an `action:bar` member). Before, the block forwarded `undoable` but handed the runner no record, so the update ran and no Undo was offered anywhere the block was used.

- **What the block now sends.** For an `undoable` `operation: update`, the button hands the runner the record in scope under `params._rowRecord`, the spelling the record page's header, the declared-actions bar, the related-record bridge and the grid's rows already use. The route dispatch strips it before it POSTs. It is attached only when the update writes that record, so where no explicit `recordId` is given, the shared route dispatch (`createServerActionHandler`) now takes the record id from it, as it does for those hosts; the record page's own dispatch already wrote to its record.
- **The one limit.** A button with no record in scope offers no Undo, because there is no row to restore. The same holds for a button whose `recordId` names a record other than the one in scope: its Undo would restore another record's values. A record that does not carry every written field offers no Undo, as before.
- **Unchanged.** A button that is not `undoable`, and an `undoable` action that is not an `operation: update`, dispatch exactly as before, with no record attached.
- **Published.** `undoable` is a published input of `action:button` (a boolean, with a description that states the limit), so the page validator stops reporting it as an unknown prop. Nothing is refused that was accepted before.

`@object-ui/types`: the `UIActionSchema.undoable` doc comment no longer says `action:button` never hands the runner a record. No type changes.
