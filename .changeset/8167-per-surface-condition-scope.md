---
'@object-ui/app-shell': minor
---

⚠️ **Behaviour change in the metadata designer: a bare field reference typed
into a page block's "Visible when (CEL)" or a hook's "Run only when (optional
CEL)" is now an ERROR in the editor.** It was accepted. Read this before
upgrading if you author either key by hand.

Both editors used to lint at the `flattened` scope — fields referenced bare,
RLS style — because the scope was nobody's decision: every `ConditionBuilder`
mount fell through `celAuthoring`'s own `hint.scope ?? 'flattened'` default. So
`status == 'done'` typed into either box came back clean, and then met a runtime
that binds the row under `record` and has no top-level `status`. Write
`record.status == 'done'`; that spelling was accepted before this change and
still is.

**What decided each one — measured, per surface, from what the evaluator binds
at runtime.**

- **A page block's `visibleWhen` is a row surface.** A page block is a SDUI
  node: the designer canvas and the page preview both hand each block to
  `SchemaRenderer`, where `visibleWhen` is enforced once and generically, and
  the evaluator there binds the row as the `record` ROOT ONLY — "NOT as bare
  fields", in that file's own words. `SchemaRenderer.visibleWhenRecordBinding.test.tsx`
  already pinned the consequence: a bare `status == 'in_review'` renders the
  block on BOTH polarities of the row. The gate does not gate.
- **A hook `condition` is bound by the server**, not by this editor's
  neighbours. `@objectstack/objectql`'s `wrapDeclarativeHook` evaluates it as
  `ExpressionEngine.evaluate<boolean>(expr, { record: record ?? {}, previous })`
  — `record` and `previous`, and nothing else. Here the old silence cost more
  than a dead gate: an unevaluable condition does not resolve false, it throws
  `HookConditionError` by design, so the author's WRITE paid for the editor's
  success receipt.

`previous` is unchanged and still accepted in a hook condition — the transition
idiom `previous.status != 'done' && record.status == 'done'` lints clean, and a
case now pins that so a later narrowing cannot take it away quietly.

**Why the fix is felt as a regression.** A predicate that never matches and a
predicate that is correct look identical on a page that renders; the editor's
green tick was the only signal either way, and it was wrong. After this change
the same metadata is rejected at authoring time instead of failing silently at
runtime. Nothing already saved changes meaning — this moves where you find out.

**Unchanged on purpose.** Every other `ConditionBuilder` mount is byte for byte
as it was: the RLS permission facets and the flow-node condition are legitimately
flattened, and the schema-driven `ConditionWidget` in `widgets.tsx` still passes
no scope while its arm is open. No component API changes — `ConditionBuilder`'s
`scope` prop stays optional, and omitting it still forwards `undefined`.
