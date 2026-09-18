---
'@object-ui/app-shell': patch
---

The metadata admin's draft gate now lints an object **validation rule's** CEL
predicate, at `scope: 'record'` — the fifth check of a kind `clientValidation`
already ran on four sibling surfaces (objectui#9497).

**Why it is not cosmetic.** The server's rule evaluator binds a validation
predicate's context as `{ record, previous }` and nothing else, and since
objectstack#4649 a predicate it cannot evaluate is fail-**closed**: it rejects
the write rather than skipping the rule. The spec's Zod checks only the SHAPE of
`condition` / `when` (`ExpressionInputSchema`), so a bare-shorthand
`amount > 100` — rather than `record.amount > 100` — was **accepted by the draft
gate and then rejected every write to the object**. The gate said nothing; the
object was wedged.

**Why the gate and not an editor.** objectui#8167 gave the inline
`ConditionBuilder` mount `scope="record"`, which closes the editor route only.
The JSON source editor, package import and AI authoring routes all reach this
gate without passing through that editor.

**What is linted.** `condition` on `script` / `cross_field` (the server's
`checkPredicate`), and `when` on `conditional` (its `checkConditional`, which
fail-closes with the same sentence) — plus, recursively, the `then` / `otherwise`
branch rules the conditional checker dispatches back through the same evaluator
with the same context. `format`, `state_machine` and `json_schema` carry no CEL
and are untouched.

**Accept-set change.** A draft carrying an unparsable predicate, a bare field
reference, or a reference to a field the object does not declare is now refused
at draft level instead of at the first write after save. Only lint **errors**
are reported (warnings would be noise at this level), and the check fails open
when the CEL engine cannot be loaded, so a missing engine costs an author a
diagnostic, never a save.

The four existing sibling checks — `visibleWhen` / `readonlyWhen` /
`requiredWhen` and a `formula` field's `expression` — are unchanged; both halves
of a sibling verdict are pinned as a live control alongside the new one.
