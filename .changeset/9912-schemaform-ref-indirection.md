---
'@object-ui/app-shell': patch
---

The metadata-admin form follows the one `$ref` indirection the served schema
uses — and the rows that buys nothing for are pinned as such (objectui#9912).

`/meta/types` derives each metadata type with `z.toJSONSchema()`, which emits a
`$defs` entry plus a `$ref` for any shape reached more than once or defined
recursively. `SchemaForm` resolved none of them, so such a node reached the
widget decision carrying no `type`, no `properties` and no `enum` and fell to
the last-resort JSON editor — while the shape it pointed at sat in the same
document. It now inlines local pointers against the document's own definitions
before any face is chosen, with the row's own keywords (its `description`, i.e.
the field's help text) laid over the inlined target rather than under it.

⚠️ The headline of the measurement is a NEGATIVE, and it is the half most
likely to be misread. Almost every `$ref` the served corpus carries outside
`$defs` is the recursive Query-DSL `FilterCondition` — `dataset.filter`,
`field.relatedListFilter`, `report.runtimeFilter`,
`dashboard.widgets[].filter`, `dataset.measures[].filter` and their siblings.
That definition derives to `allOf: [ an open record, { $and / $or / $not } ]`:
no top-level `type`, no top-level `properties`, so the face after resolution is
the SAME JSON editor it is today. Those rows are not what this buys, and the
spec's own `report` form declares `widget: 'json'` on `runtimeFilter`, so the
JSON editor is the intended control there rather than a fallback. The rows that
do move are the ones whose pointer sits in an array-items or record-value
position and names an object shape: `app.navigation` goes from one opaque
textarea to a repeater whose rows carry real labelled controls.

The walk is position-aware in the same way the producer's own is
(`@objectstack/metadata-protocol`'s `unauthorable-nodes.ts`): keywords whose
value is DATA (`default`, `const`, `enum`, `required`, …) are never followed,
and `properties` / `patternProperties` / `dependentSchemas` are read as maps of
author-chosen NAMES whose values are schemas. A pointer already on the
resolution stack is left as the `$ref` node it is, which is what keeps the
self-recursive `FilterCondition` from hanging the walk. A document with nothing
to resolve is returned by reference, so every type that carries no `$ref`
renders from the very same object as before.
