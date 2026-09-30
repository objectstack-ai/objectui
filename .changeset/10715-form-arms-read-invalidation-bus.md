---
'@object-ui/plugin-form': patch
---

fix(plugin-form): every `object-form` layout re-reads its record on the data-invalidation bus (objectui#10715)

`object-form` in edit mode re-reads its record when the data-invalidation bus
(`notifyDataChanged` from `@object-ui/react`) reports a change to that record,
its object, or everything, gated on pristine (objectui#10572). Until now only
the default layout did. With `formType` set to `drawer`, `modal`, `split`,
`tabbed` or `wizard`, the form kept the record as first read: after a change
another writer announced on the bus, `findOne` stayed at one call on each of
the five, while the default layout read again.

The five layouts now read the bus by the default layout's rule, which is stated
once in the package: a pristine form re-reads in place, without remounting; a
form holding unsaved input keeps the typed values and the version token its
edit started from, and replays one held re-read once the edit is saved or the
form returns to pristine; a change to another object, or to another record of
the object, reads nothing; a create form reads nothing. The re-read runs
through each layout's own record read, so a re-read a later one has superseded
commits nothing (objectui#10712).

Two layouts have state of their own. A wizard also holds the re-read while a
step submitted with Next carries an answer not yet saved, so a re-read never
discards it, and a re-read never moves the wizard off its current step. A
closed drawer or modal reads while closed and opens on the fresh values, with
no further read on open. No prop, export or schema key changes.
