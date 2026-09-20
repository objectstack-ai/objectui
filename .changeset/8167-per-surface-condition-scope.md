---
'@object-ui/app-shell': minor
---

⚠️ **Behaviour change in the metadata designer: a bare field reference typed into
a hook's "Run only when (optional CEL)" is now an ERROR in the editor.** It was
accepted. Read this before upgrading if you author hook conditions by hand.

That editor linted at the `flattened` scope — fields referenced bare, RLS style —
because the scope was nobody's decision: every `ConditionBuilder` mount fell
through `celAuthoring`'s own `hint.scope ?? 'flattened'` default. So
`status == 'done'` came back clean, and then met a server that binds the row
under `record` and has no top-level `status`. Write `record.status == 'done'`;
that spelling was accepted before this change and still is.

**What decided it — measured from what the evaluator binds at runtime.**
`@objectstack/objectql`'s `wrapDeclarativeHook` evaluates the condition as
`ExpressionEngine.evaluate<boolean>(expr, { record: record ?? {}, previous })` —
`record` and `previous`, and nothing else. Here the old silence cost more than a
dead gate: an unevaluable condition does not resolve false, it throws
`HookConditionError` by design, so the author's WRITE paid for the editor's
success receipt.

`previous` is unchanged and still accepted — the transition idiom
`previous.status != 'done' && record.status == 'done'` lints clean, and a case
now pins that so a later narrowing cannot take it away quietly.

**Why the fix is felt as a regression.** A hook condition that can never evaluate
and one that is correct look identical until a write is attempted; the editor's
green tick was the only author-time signal, and it was wrong. After this change
the same metadata is rejected at authoring time instead of at write time. A hook
condition already saved keeps the meaning it always had — this moves where you
find out.

**Scope of this change — one mount, deliberately.** Every other
`ConditionBuilder` mount is byte for byte as it was. In particular the page
block's `visibleWhen` mount is **unchanged and still lints `flattened`**: its
renderer binds `record`, `current_user` *and* `page.<var>`, and neither available
lint scope expresses that set — at `record` the engine refuses
`page.selectedProjectId != ''`, which is `@objectstack/spec`'s own documented
example for that key. That arm is blocked on an engine-vocabulary change, not on
this package, and is recorded on objectui#8167. No component API changes:
`ConditionBuilder`'s `scope` prop stays optional, and omitting it still forwards
`undefined`.
