---
'@object-ui/core': minor
'@object-ui/app-shell': minor
---

fix(core): Undo of an `undoable` update no longer writes `null` over a field the row did not carry

An `undoable` update records the prior value of every field it writes, read off
the row it ran on, so the success toast can offer Undo. On a list row projected
by `$select` (`ListView`, `ObjectGrid`, `RelatedList`), a written field that no
column shows was absent from the row. It was recorded as `null`, and Undo then
wrote `null` over the value it existed to restore: close a task from a grid that
shows only its name, press Undo, and its status became empty instead of `open`.

Two changes:

- The list harvest (`listViewPredicates`) now also names the fields an
  `undoable` action writes: its `patch` keys, the key each param's value is
  collected under (`name`, else `field`), and its `bodyExtra` keys. So a
  projected row carries them, through the same gates as every harvested name:
  a bare identifier, a field the object declares (or a platform column), and
  field-level security once the permission answer has loaded. `recordId` is
  not harvested; both writers strip it as the record's address.
- The capture never records an absent field as `null`, in `ActionRunner`'s
  `operation: 'update'` path and in the console `api` handler's data-source
  branch alike. When the row does not carry every written field (for example a
  field the principal may write but not read), the action still runs, but it
  offers no Undo: the success toast has no Undo button, nothing is pushed onto
  the undo stack, and a console warning names the missing fields. A `null` the
  row does carry is a real empty value and is still restored as `null`.

Behaviour to know about: on a backend that leaves null-valued fields out of a
full record, an `undoable` update of such a field now offers no Undo instead of
one that restores it to empty. Absent and empty cannot be told apart there, and
no Undo is the side that cannot overwrite stored data.
