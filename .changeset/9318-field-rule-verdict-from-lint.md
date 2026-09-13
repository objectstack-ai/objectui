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
key, and on the slots the published vocabulary covers — `visibleWhen`, `readonlyWhen`,
`requiredWhen` — the verdict and the message now come from the helper. Both are
internal to `@object-ui/app-shell`; no package export moves.

**Behaviour change, deliberate and warning-only.** Those three editors now advise on
every root the field level leaves unbound, not only `data`: a field rule reading
`current_user` or `app` gets the engine's own diagnostic, which refuses the
`record.<root>` rewrite by name instead of merely omitting it. Severity stays
objectui's own `warning` — every save gate on this tier counts `severity === 'error'`,
so no accept set moves and no predicate already stored in customer metadata is refused.

**Coverage is not shrunk to fit the helper.** Two guarded surfaces bind a different
set, in opposite directions — a `formula` field's `expression` binds `FORMULA_ROOTS`
(`record`, narrower) and a conditional-formatting `condition` binds
`ROW_PREDICATE_ROOTS` (`record`, `current_user`, `user`, `features`, `os`, `ctx`,
wider). Those keep the local instrument unchanged, and both are pinned as live
controls against a later tidy-up that routes them through the helper anyway.
