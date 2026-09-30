---
'@object-ui/core': patch
---

`ValueDataSource.find` now answers a `Date` equality or membership test with the rows
holding that instant as a `Date`, in both filter dialects (objectui#10829). The object
dialect used to drop an implicit `Date` equality, and every explicit equality or
membership test compared a `Date` by identity.

**Before — the object dialect.** The object-dialect matcher sent every object condition
that is not an array to its operator branch. A `Date` has no own keys, so the operator
loop ran zero times and the field added no constraint: `{ status: 'a', created: someDate }`
answered the same rows as `{ status: 'a' }`, and `{ created: someDate }` answered every
row, with no console line. `convertFiltersToAST` lowers the same filter to
`['created', '=', someDate]` (objectui#8555), because `@objectstack/spec`'s
`ACCEPTED_FILTER_COMPARAND_TYPES` includes `Date`.

**Before — both dialects.** Every equality and membership position compared with `===`,
and membership with `includes`, so a `Date` was compared by identity. The adapter clones
the rows it is constructed with, so none of those rows held the comparand's instance:
over them `['created', '=', someDate]`, `{ created: { $eq: someDate } }` and
`$in: [someDate]` matched nothing, not even the row holding that exact instant, while
`$gte` and `$lte` both matched it, and `!=`, `$ne` and `$nin` selected every one of
them. Only a row written through `create` or `update`, which copy the record shallowly,
could hold the caller's own instance and match it by identity.

**After.** A condition the spec's `isAcceptedFilterComparand` accepts takes the
object dialect's implicit-equality branch, the predicate the converter lowers a `Date`
through; today a `Date` is its only object-typed member. One equality helper serves
implicit equality, `$eq` / `$ne` / `$in` / `$nin` and the AST `=` / `!=` / `in` / `nin`:
when the stored value and the comparand are both `Date` instances it compares
`getTime()`, and an invalid `Date` equals nothing. So an object filter answers what its
lowered array answers, and `=`, `$gte` and `$lte` agree on one instant.

**Unchanged.** A `Date` comparand is not coerced to another storage form: a row holding
the same instant as an ISO string or as epoch milliseconds does not equal it.
`@objectstack/spec`'s `FILTER_COMPARAND_TYPE_CASES` declines to assert a `Date` row set,
because what it matches "legitimately differs per storage form (ADR-0053)". `$gt` /
`$gte` / `$lt` / `$lte` / `$between` compare a `Date` by its number, as before. Every
other comparand keeps `===`. The one value where membership moves is the number `NaN`:
`includes` found a stored `NaN` in `[NaN]` and `===` does not, so `$in: [NaN]` and
`['x', 'in', [NaN]]` no longer match a stored `NaN`, and `$nin` / `nin` now keep that
row, agreeing with `{ x: NaN }` and `$eq`, which never matched it.

**Clause-②: no** — the value face stops dropping a `Date` constraint that
`@objectstack/spec`'s `ACCEPTED_FILTER_COMPARAND_TYPES` accepts and the converter lowers
to equality; no declared surface moves and no export is added.
