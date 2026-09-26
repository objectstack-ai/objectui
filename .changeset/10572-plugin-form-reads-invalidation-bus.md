---
'@object-ui/plugin-form': patch
---

`object-form` in edit mode re-reads its record when the data-invalidation bus (`notifyDataChanged` from `@object-ui/react`) reports a change to that record, its object, or everything (objectui#10572). The re-read is gated on pristine: an untouched form refreshes in place without remounting, while a form holding unsaved input keeps both the typed values and the version token its edit started from, so a real conflict still surfaces at save. One held re-read is replayed once the edit is saved or the form returns to pristine. A change to another record of the object reads nothing.
