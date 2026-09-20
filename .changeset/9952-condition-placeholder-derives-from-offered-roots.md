---
'@object-ui/app-shell': patch
---

Derive `ConditionBuilder`'s CEL placeholder from the roots the mount OFFERS, so the
example can no longer teach a root that mount does not bind (objectui#9952).

The placeholder was a string literal — `record.status != 'done' && user.isAdmin` —
handed to `CelPredicateField` at **every** mount, `scope` or no `scope`. The same
component had already narrowed a record-scoped mount's autocomplete to
`RECORD_CONDITION_ROOTS` (objectui#9645), which carries no `user`, and narrowed that
mount's subject dropdown the same way (objectui#9855). At such a mount `user` is not
merely unadvertised: `conditionScope.ts` states that a hook `condition` and a
validation rule's guard are evaluated with `{ record, previous }` and only those,
fail-CLOSED at the validation host, and objectstack's `wrapDeclarativeHook` docblock
says the condition formula is evaluated against two bindings, `record` and
`previous`. So the one line an author reads before typing anything taught a root the
evaluator never binds, and copying it cost the author the write.

The placeholder is now derived by `celExampleForRoots` from the very value forwarded
to the autocomplete: an example clause survives only when every root it SPELLS —
read back out of the clause's own text by `celRootsMentioned` — is offered at that
mount. There is no per-scope table and no second list of roots to keep in step,
which is how the autocomplete, the subject dropdown and this placeholder got out of
step one control at a time.

**No capability is removed.** A mount that declares no narrowing forwards `undefined`
and inherits the engine's own advertisement, which carries `user`, so its placeholder
is what it always was; a mount that binds more says so through the existing `roots`
prop and gets those clauses taught again. Only the TEACHING narrows — the accept set
and the subject dropdown are untouched.

New exports on `@object-ui/app-shell`: `celExampleForRoots` and `celRootsMentioned`.
