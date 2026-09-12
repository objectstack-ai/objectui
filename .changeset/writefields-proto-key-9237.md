---
'@object-ui/app-shell': patch
---

fix(app-shell): stop `writeFields` deleting a stored field named `__proto__` from the object-metadata PUT body

The object designer's draft serializer built its `fields` map by assigning into
an object literal. For the one field name `__proto__` that assignment invokes
`Object.prototype`'s accessor instead of creating an own property, so the entry
`readFields` had just read back was dropped before `JSON.stringify` saw it.

`__proto__` is a spec-legal stored field key, so the mutilated document was
ACCEPTED: the PUT succeeded, the server stored the object without the field,
the designer kept showing its in-memory copy, and nothing reported anything.
Unlike every other defect in this family it is not a recoverable 422 — a reload
does not bring the field back, because it is gone from the store. Any save or
field reorder triggered it, including edits that never touched that field.

`Object.fromEntries` defines an own property, which is why
`MetadataService.toFieldsMap` already used it. All 14 `writeFields` call sites
across the designer are covered by the single change.
