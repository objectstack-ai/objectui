---
'@object-ui/core': patch
---

`convertFiltersToAST` now refuses an EMPTY operator map that is all a filter says —
`{ a: {} }`, `{ a: {}, b: undefined }`, `{ $and: [], a: {} }` — with a
`FilterOperatorError` (`INVALID_FILTER` / 400) whose subject is the field, instead of
handing the caller's own object back (objectui#9164).

**Before.** `{ a: {} }` names a field and no operator. The converter entered the key,
the operator loop ran zero times, and with no condition produced the general tail
returned the CALLER'S ORIGINAL OBJECT — the one input still doing so after
objectui#8770, objectui#9020 and objectui#9030. `@object-ui/data-objectstack`'s `find()`
then sent two different wrong requests for it: `?a=[object Object]` with no `filter`
parameter on the plain route, and `filter={"a":{}}` on the `$expand` / `$search` route —
a shape `@objectstack/spec` rules REJECTED (objectstack#5240, recorded on
`FilterConditionSchema`).

**After.** The filter is refused where the field name is still in hand. The message
names the field and the fix: choose an operator (`$eq`, `$in`, `$null`, …) or remove the
key. It is not folded to "no filter", which would silently drop a filter the author
wrote, and not lowered, because the spec accepts no form of it. `FilterOperatorError`
carries `field` and no `operator`, so `filterRefusalSubject` names the field.

**What an author sees.** The same as for this function's other refusals. A list or view
that loads through `buildEffectiveFilter` / `ObjectView` fails its load with the
`INVALID_FILTER` envelope, which `classifyLoadError` reports as a malformed filter.
`ObjectGrid`, `RelatedList` and `LineItemsPanel` read `toFilterNodeSafely` and render the
"this view's filter is malformed" state naming the field. `@object-ui/data-objectstack`'s
`find()` and export reject with the envelope instead of sending either wrong request.

**Also changed, by the same tail.** A combinator child that is an empty operator map is
refused too. `{ $or: [{ a: {} }, { b: 2 }] }` used to lower to "no filter" (every row),
because the child came back as its own object and `lowerLogicalGroup` read that as a TRUE
disjunct. `{ $and: [{ a: {} }] }` dropped its only conjunct the same way.

**Unchanged.** `{}` still returns `{}`, and `toFilterNode` still answers `undefined` for
it. A filter that lowers (`{ a: 'x' }`) still lowers. An empty operator map BESIDE a key
that lowers is still dropped — `{ status: 'a', created: {} }` lowers to
`['status', '=', 'a']`. That boundary is pinned by objectui#8555 and objectui#8567, and
this change does not move it. The TRUE-identity fold (objectui#8770 / objectui#9030) and
the all-skipped fold (objectui#9020) are unchanged.

**Migration.** A stored filter carrying `{ field: {} }` with nothing else to say was a
wrong request before this change. It is now a named refusal. Give the field an operator,
or delete the key.

⚠️ **Dated note, 2026-09-27 — the beside-a-key boundary is now refused too — objectui#10788.**
Later in this same release an empty operator map BESIDE a key that lowers
(`{ status: 'a', created: {} }`) is refused as well, with the same `FilterOperatorError`
naming the field, instead of being dropped. The refusal moved from the general tail into
the operator-map arm, so one throw site answers both cases. The "Unchanged" paragraph's
sentences about that boundary is this change's reading, not the release's. The rest of this
entry is kept as the reading of this change; the objectui#10788 entry states what that input
now answers.
