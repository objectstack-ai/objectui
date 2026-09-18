---
'@object-ui/app-shell': minor
---

fix(app-shell): `ConditionBuilder`'s subject dropdown stops offering roots the host does not bind

Two halves of one ruling, split by what each root actually is.

**`org.id` leaves the default vocabulary.** No host binds an `org` root
(`buildExpressionScope` publishes the identity roots and no `org`), and
`@objectstack/formula`'s `SCOPE_ROOTS` has none either, so the record-scope
validator rejects `org.id` outright and names a record field that does not
exist as the remedy. The editor was advertising a subject its own linter
refuses — the `app` case objectui#8155 settled for `ConditionalFormattingEditor`,
reached here through a different control.

**The server-evaluated mounts now declare their own narrower subject list.** A
hook `condition` and an object validation rule's guard are evaluated against
`{ record, previous }` and nothing else — the hook wrapper throws on an
unevaluable condition, and the rule validator is fail-closed, so a `user.*`
subject there built a row that could never match. Those two mounts declare
`context: RECORD_CONDITION_SUBJECTS`; the dropdown's default is unchanged.

`user.*` is deliberately still offered everywhere else: the engine accepts it
and the browser-side evaluator binds it, so it is a subject that really works
at the client-evaluated mounts (action `visible` / `disabled`, page blocks).
The narrowing is declared per mount, never derived from `scope === 'record'` —
that test does not separate the hosts.

A predicate already authored against `org.id` is unaffected: it still opens in
row mode with its subject selectable, and the raw editor still treats a typed
`org.id` as a reference rather than quoting it.
