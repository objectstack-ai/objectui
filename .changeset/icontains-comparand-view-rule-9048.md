---
'@object-ui/core': minor
---

Refuse an empty or non-string `icontains` comparand on the stored-view rule path, and give all three `@object-ui/core` faces one implementation of that refusal

`@objectstack/spec`'s `FILTER_TEXT_CASES` declares two shapes refused for the case-insensitive contains operator — an empty comparand and a non-string one — each with `code: 'INVALID_FILTER'`. `ValueDataSource` has answered both since objectui#8748 and `convertFiltersToAST` since objectui#9001, but `viewFilterRuleToNode` (reached through the exported `toFilterNode`) lowered both onto the wire: a rule an author saved as `{ field, operator: 'icontains', value: '' }` became `['name','icontains','']`, which the in-memory matchers answer with zero rows while the published table states the wire answer is a predicate that constrains nothing. Same authored filter, two answers, chosen by which data source the view renders against.

The refusal now throws `FilterOperatorError` (`INVALID_FILTER` / 400) from the lowering, naming the field and the operator spelling the view vocabulary actually uses. A valid comparand, the sibling positive operators (`contains` / `starts_with` / `ends_with`), objectui#8557's array-arity refusal and a rule carrying no comparand at all are all unchanged.

The discrimination and the refusal text moved into one internal module that `ValueDataSource`, `convertFiltersToAST` and `viewFilterRuleToNode` all read, so the three faces cannot drift. Both already-shipped messages are byte-identical to what they were. No published export was added.
