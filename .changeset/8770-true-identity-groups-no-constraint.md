---
'@object-ui/core': minor
'@object-ui/data-objectstack': minor
---

Lower the TRUE-identity filter combinators to "no constraint" instead of handing the
caller's own object back (objectui#8770).

`convertFiltersToAST({ $and: [] })`, `{ $or: [{}] }` and `{ $and: [{}] }` returned the
INPUT OBJECT unchanged. `lowerLogicalGroup` correctly answers `undefined` for a group
that reduces to the TRUE identity — objectstack#5322 rules all three "every row", and a
childless `['and']` would be `isFilterAST` FALSE — but when such a group was the only
thing in the filter, that `undefined` fell through to the general tail
(`if (conditions.length === 0) return filter`) and the group reappeared one level up, in
the `$` dialect, in the slot the AST occupies. The same function already lowered the
fourth identity, `{ $or: [] }`, correctly, so this was an internal inconsistency rather
than an open question; the consumer half was settled by objectui#8513.

**This widens what those three filters return, and that is the point.** Measured against
`@objectstack/spec` 17.4.0 and `@objectstack/client` 17.4.0 before the change: the
returned object is not sent as a filter and refused — `client.data.find()` tests the
value with `isFilterAST` and its else branch spreads a plain object's entries as query
parameters, so `{ $and: [] }` left as `?$and=` with **no `filter` parameter at all**, and
the server answered `400 UNSUPPORTED_QUERY_PARAM` for the unknown `$`-prefixed
parameter. A filter whose ruled answer is EVERY ROW was a **failed list**, not a narrowed
one — so nothing could have been relying on it to scope data. On the sibling
`$expand` / `$search` route the same object travelled as `filter={"$and":[]}`, which the
server accepts as a `FilterCondition` and already answers with every row; the two routes
disagreed about one filter and now agree.

**`@object-ui/core`.** `convertFiltersToAST`'s declared return type gains `undefined`,
which is what `toFilterNode`, `mergeFilterNodes` and `data-objectstack`'s
`translateFilterToAST` already mean by "no filter, skip the slot". Every call site
already acted on it. The fold is scoped to a filter whose EVERY key is such a group:
the same tail also serves `{}`, an all-null filter and an empty operator map, and those
keep the object they always returned — a null-valued key is this converter's own
tolerance rather than a ruled identity, and the object it hands back reaches the server
as a REAL `a IS NULL` predicate on the `$expand` route, so folding it in would return
more rows on a path the ruling said nothing about.

`{ $or: [] }` is untouched: FALSE is not "no constraint", the AST has no contradiction
literal, and its `['$or', '=', []]` leaf answers FALSE at both consumers.

**`@object-ui/data-objectstack`.** `convertQueryParams` skips the `filters` slot when the
lowering answers `undefined`, the same answer the raw-GET route's
`if (translated !== undefined)` already gave, so the two `find()` routes cannot disagree
about one filter.

**Migration.** A TypeScript caller that stored `convertFiltersToAST(...)` in a
`FilterNode | Record<string, any>` slot must widen it with `| undefined` and skip the
filter when it is absent — the same handling `toFilterNode` has always needed. At
runtime, a filter that is nothing but TRUE-identity combinators now returns every row
(what objectstack#5322 rules) instead of failing the request.
