---
'@object-ui/core': patch
---

`convertFiltersToAST` now refuses an EMPTY operator map BESIDE a key that lowers —
`{ status: 'a', created: {} }` — with a `FilterOperatorError` (`INVALID_FILTER` / 400)
whose subject is the field, instead of silently dropping it (objectui#10788).

**Before.** `{ created: {} }` names a field and no operator, so the operator loop ran zero
times and pushed no condition for it. objectui#9164 refused that map in the general tail,
but the tail was reached only when NOTHING produced a condition. Beside a key that lowers,
the sibling's condition carried the filter and the field vanished:
`{ status: 'a', created: {} }` lowered to `['status', '=', 'a']`, and both `find()` routes
of `@object-ui/data-objectstack` sent a request byte-identical to `{ status: 'a' }`. The
result was WIDER than the author wrote, with nothing thrown. `@objectstack/spec` records
`{ field: {} }` as REJECTED in every position (objectstack#5240, on
`FilterConditionSchema`).

**After.** The empty operator map is refused in the operator-map arm, where it is met, like
this function's bare-array and exotic-comparand refusals. One throw site now answers it
alone (objectui#9164) and beside other keys, so the two cases cannot drift apart. The
message names the field and the fix: choose an operator (`$eq`, `$in`, `$null`, …) or
remove the key. A `$and` / `$or` member is converted by the same function, so
`{ $and: [{ status: 'a', created: {} }] }` is refused too.

**What an author sees.** The same as for this function's other refusals. A list or view
that loads through `buildEffectiveFilter` / `ObjectView` fails its load with the
`INVALID_FILTER` envelope. `ObjectGrid`, `RelatedList` and `LineItemsPanel` read
`toFilterNodeSafely` and render the "this view's filter is malformed" state naming the
field. `@object-ui/data-objectstack`'s `find()` rejects with the envelope and sends no
request.

**Unchanged.** `{ status: 'a' }` still lowers to `['status', '=', 'a']`. A real operator
beside the key (`{ status: 'a', created: { $gte: d } }`) still lowers. A `null` /
`undefined` value is still skipped, not refused. `{}` still returns `{}`.

**Migration.** A stored filter carrying `{ field: {} }` beside other keys used to return
more rows than it said. It is now a named refusal. Give the field an operator, or delete
the key.
