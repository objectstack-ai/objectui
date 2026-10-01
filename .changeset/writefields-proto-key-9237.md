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

**Correction, 2026-10-01 (objectui#9787).** The paragraph above that begins "`__proto__` is a spec-legal stored field key" says the mutilated document was ACCEPTED. That held through `@objectstack/spec` 17.4.0, while this defect shipped, and there the drop was silent. It no longer holds as a present-tense statement. Since 17.5.0 the spec refuses a `fields` map that carries an own `__proto__` key, at `fields.__proto__`. A body that has already lost the key is still accepted, so the `Object.fromEntries` fix stays load-bearing: the refusal can name the field only if the body still carries the key. The spec's verdict is re-measured by the "keys the record with a snake_case rule" test in `MetadataService.objectPayloadFieldsMap.test.ts`, and the `writeFields` half by "the spec still ACCEPTS the mutilated body" in `object-fields-io.prototypeKey-9237.test.ts`. The fix this entry describes is unaffected.
