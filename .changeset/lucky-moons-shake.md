---
'@object-ui/app-shell': minor
---

fix(app-shell): `ConditionBuilder`'s subject dropdown no longer offers `org.id`

The row builder's subject dropdown kept its own default vocabulary, so `org.id`
stayed one click away at every mount that declares none — including the
server-evaluated ones. No host binds an `org` root (`buildExpressionScope`
publishes the identity roots and no `org`), and `@objectstack/formula`'s
`SCOPE_ROOTS` has none either, so the record-scope validator rejects `org.id`
outright and names a record field that does not exist as the remedy. The editor
was advertising a subject its own linter refuses — the `app` case objectui#8155
settled for `ConditionalFormattingEditor`, reached here through a different
control.

`user.*` is deliberately unchanged: the engine accepts it and the browser-side
evaluator binds it, so it is a subject that really works at the
client-evaluated mounts. A mount whose host does not bind it narrows its own
list through the existing `subjects.context` vocabulary.

A predicate already authored against `org.id` is unaffected — it still opens in
row mode with its subject selectable, and the raw editor still treats a typed
`org.id` as a reference rather than quoting it.
