---
'@object-ui/core': patch
---

`ValueDataSource.find` now reads a `Date` condition in an object `$filter` as implicit
equality instead of silently dropping that field's constraint (objectui#10829).

**Before.** The object-dialect matcher sent every object condition that is not an array
to its operator branch. A `Date` has no own keys, so the operator loop ran zero times
and the field added no constraint: `{ status: 'a', created: someDate }` answered the
same rows as `{ status: 'a' }`, and `{ created: someDate }` answered every row, with no
console line. `convertFiltersToAST` lowers the same filter to
`['created', '=', someDate]` (objectui#8555), because `@objectstack/spec`'s
`ACCEPTED_FILTER_COMPARAND_TYPES` includes `Date`.

**After.** A condition the spec's `isAcceptedFilterComparand` accepts takes the
simple-equality branch, the predicate the converter lowers a `Date` through; today a
`Date` is its only object-typed member. The branch compares with `===`, exactly as the
AST arm's `=` does, so an object filter answers what its lowered array answers. An
invalid `Date` is lowered by the converter too, and is answered the same way.

⚠️ **What that answer is today.** `===` compares a `Date` by identity, and the adapter
clones every row on construction, so on both arms no stored value equals a `Date`
comparand: not a `Date` of the same instant, not its ISO string, not its epoch
milliseconds. A filter that selected every row its other keys allowed now selects none.
`$eq`, `$ne`, `$in` and `$nin` on a `Date` already answered what their AST twins answer,
and `$gt` / `$gte` / `$lt` / `$lte` compare a `Date` by its number on both arms; none of
them moves.

**Clause-②: no** — the value face stops dropping a `Date` constraint that
`@objectstack/spec`'s `ACCEPTED_FILTER_COMPARAND_TYPES` accepts and the converter lowers
to equality; no declared surface moves and no export is added.
