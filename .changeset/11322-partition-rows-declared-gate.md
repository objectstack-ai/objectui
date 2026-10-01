---
'@object-ui/core': patch
---

`partitionRowsByPredicate` asks the repo's one "is a gate declared?" definition, `hasDeclaredPredicate`,
instead of its own `pred == null || pred === ''` test (objectui#11322).

What a user sees: a bulk action whose `visible` is blank now shows on the grid's selection bar and runs
over every selected record, as the row menu and the toolbars already treat it. Before, a whitespace-only
predicate or an envelope whose `source` is blank counted as declared, failed closed for every record and
left nothing eligible.

The fold is key-neutral, so the same answer reaches the built-in Delete's
`userActions.delete.visibleWhen` on both selection bars: a blank one now admits every selected record
instead of excluding them all. Booleans and real predicates are unchanged, and a blank is reported once
(ADR-0137 D4).
