---
'@object-ui/core': patch
---

Docblock only, no behavior change: `partitionRowsByPredicate` now names its callers and says who decides
"is a gate declared?" (objectui#11322).

The shared partitioner keeps its opening test exactly as it was (`null`, `undefined` or `''` admits
every record). Its docblock used to call that test "blank string", which it never was: whitespace-only
text and an envelope whose `source` is blank are evaluated there and exclude every record. That is the
answer its built-in Delete `userActions.delete.visibleWhen` callers get. The bulk-action fold asks the
action family's `hasDeclaredVisibilityGate` before calling it, so a blank bulk `visible` reaches it as
`undefined`. `hasDeclaredPredicate`'s docblock names that new consumer and the field-rule tests that stay
outside the family.
