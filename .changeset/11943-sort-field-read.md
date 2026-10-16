---
'@object-ui/plugin-list': patch
---

The list's Sort picker no longer offers a field the user may not read (objectui#11943). Choosing such a field sent a sort the server refuses, and the list went blank on "no access". The picker now asks the same field-level read check as the list's columns and its Filter panel, `checkField(objectName, field, 'read')` from the permission context. The Filter panel and the Sort picker share one predicate for it.

- **A field the current sort already uses stays listed.** A stored or URL sort on an unreadable field still shows its row by name, so it can be removed. For now that field is also still offered in the picker's other rows. Listing it only as removable is a follow-up.
- **Nothing else changes.** While the permission answer has not loaded, the list is as before, the same way the column check defers. A user who may read every field sees the same list, in the same order. A link field the user may not read no longer brings up the hint about link fields not being sortable. The Filter panel's list is unchanged.

**Clause-②: no** — no export, prop, type member or accepted input changes.
