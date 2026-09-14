---
'@object-ui/app-shell': minor
---

The wrong-layer root advisory asks the platform for its verdict instead of keeping
a second copy of it (objectui#9318).

`rowCanonAdvisory` answered "is this root bound on this surface?" from objectui's
own knowledge — `@object-ui/core`'s detector hard-codes the single root `data`, and
the docblock justified that from `ROW_PREDICATE_ROOTS` / `FIELD_RULE_ROOTS` /
`FORMULA_ROOTS`. `@objectstack/lint` publishes the same judgement as
`fieldRuleRootIssue` / `FIELD_RULE_BOUND_ROOTS`, pinned upstream. Two hand-maintained
copies of one judgement, agreeing today, with nothing keeping them agreeing: the next
root the platform binds or unbinds moves one and not the other, silently.

A `CelSchemaHint.slot` (and the matching `CelPredicateField` prop) names the authored
key, and on the three slots whose bound set IS the field-rule set — `visibleWhen`,
`readonlyWhen`, `requiredWhen` — the verdict and the message now come from the helper.
That set is objectui's own answer, not the helper's: `fieldRuleRootIssue` has no slot
vocabulary at all — hand it any slot name and it still judges, gating on the ROOT and
interpolating whatever name it was given. Which surfaces it may answer for is therefore
this repo's call. Both are internal to `@object-ui/app-shell`; no package export moves.

**Behaviour change, deliberate and warning-only.** Those three editors now advise on
every root the field level leaves unbound — except `app` — where before only `data`
was reported, and each carries the engine's own per-root diagnostic rather than
objectui's single sentence. `app` is the one exception, and for a structural reason
rather than as a special case: the advisory runs only on an error-free predicate, and
`app` is the single judged root the platform does not declare, so the pre-existing
bare-reference error fires first and the advisory never runs. Severity stays
objectui's own `warning` — every save gate on this tier counts `severity === 'error'`,
so no accept set moves and no predicate already stored in customer metadata is refused.

**Coverage is not shrunk to fit the helper.** Two guarded surfaces bind a set that is
not the field-rule set, and neither is comparable to it — they overlap on `record`
alone. A `formula` field's `expression` binds `FORMULA_ROOTS` (`record`), a proper
subset. A conditional-formatting `condition` binds `ROW_PREDICATE_ROOTS` (`record`,
`current_user`, `user`, `features`, `os`, `ctx`) — five roots the field tier does not
bind, but not a superset of it either, since it lacks `previous` and `parent`. Routed
through the helper, the condition would be told to rewrite five roots that work there,
and the formula would be told `previous` and `parent` are bound when it binds neither.
Those keep the local instrument unchanged, and both are pinned as live controls against
a later tidy-up that routes them through the helper anyway.
