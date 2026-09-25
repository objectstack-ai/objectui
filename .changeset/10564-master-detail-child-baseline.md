---
'@object-ui/plugin-form': patch
---

A master-detail edit form that stays open after a save no longer re-creates the line items it just created, re-deletes the ones it just deleted, or drops a line cell changed back to its first-read value (objectui#10564).

**Clause-②: no.** No exported symbol, type or prop changes. The change is in what the form's next save sends.

**Before.** The form diffed every save against the child rows it read when it opened. A host that keeps the form mounted after a save (an `onSuccess` that does not navigate away) therefore got:

- a second copy of a line the first save created, because that row never learned its id and was created again on the next save;
- a second `delete` of a line the first save had already deleted;
- a lost edit when a line cell was changed, saved, and changed back to its first-read value: the second save sent no line operation and still reported success, and the server kept the first save's value.

**What changed, in observable terms.**

- After a successful edit save, the rows that save created take the ids the batch returned for them, and the collection's baseline takes on what the save wrote. The next save compares with the lines as they now stand. This is the same rule the parent record already followed after a save (objectui#10156).
- A save that fails advances nothing, neither the parent nor the lines, so a retry still sends every operation.
- A line created by a save and edited while that save was still in flight is not duplicated. The next save deletes the created record and creates the line as it now stands.
- Create mode is unchanged: a successful create still clears the lines and the header for the next entry.
