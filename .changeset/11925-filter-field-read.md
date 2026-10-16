---
'@object-ui/plugin-list': patch
---

The list's Filter panel offers only the fields the user may read (objectui#11925). Its field list now asks the same field-level read check the list's columns already use, `checkField(objectName, field, 'read')` from the permission context, so a field the grid does not show to this user can no longer be chosen as a filter condition, and the two field lists cannot drift apart.

- **Both sources pass the check.** The list is built from the object definition and, while that has no field map, from the view's declared columns. A field the user may not read is dropped from either.
- **Nothing keeps an unreadable field listed.** Not the view's `filterableFields`, and not a condition the panel already holds.
- **Nothing else changes.** While the permission answer has not loaded, the list is as before, the same way the column check defers. A user who may read every field sees the same list, in the same order. The `filterableFields` whitelist, the hidden-field rule and the ordering are unchanged, and so is the sort picker.

**Clause-②: no** — no export, prop, type member or accepted input changes.
