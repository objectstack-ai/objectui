---
'@object-ui/core': patch
---

`convertFiltersToAST` now refuses a non-Date EXOTIC object in comparand position
— `{ name: /abc/ }`, a `Set`, a `Map`, a `URL`, any class instance — with a
`FilterOperatorError` (`INVALID_FILTER` / 400) that names the field and the
value, instead of silently dropping the condition (objectui#8567).

This is the other half of the hole objectui#8555 closed. The operator-object arm
iterates `Object.entries(value)`, and `Object.entries` of a `RegExp`, a `Set`, a
`Map` or a `URL` is `[]` — so the loop body never ran and NO condition was pushed
for the field: `{ status: 'a', created: /abc/ }` lowered to
`['status', '=', 'a']`. Nothing threw and nothing warned; the result set simply
got WIDER than the author asked for, which is the one failure direction this file
exists to avoid. As with the Date half, it depended on the field's siblings —
with the exotic value alone, `conditions` ended empty and the original object came
back untouched, so the defect was invisible until a second field appeared.

It is REFUSED, not lowered, and `@objectstack/spec` is what decides that — the
opposite answer to objectui#8555 for the opposite reason. Measured against spec
17.3.0: `isAcceptedFilterComparand(/x/)` is `false`, and
`normalizeFilterComparandTypes({ created: /x/ })` answers `INVALID_FILTER` / 400
— *"Filter comparand at where.created is a RegExp instance ({}), which no driver
can compare."* Lowering the value would only move that refusal downstream, so the
answer the wire would give two layers later is given at lowering time, where the
field name and the offending value are both still in hand. The message states the
accepted types in the spec's own words (`ACCEPTED_FILTER_COMPARAND_TYPES_SENTENCE`)
rather than repeating a second list, and prescribes `$contains` / `$startsWith` /
`$endsWith` for a text match, `$in` for a membership test and `$gte` with a `Date`
for a date bound.

The gate is the value's PROTOTYPE, not `Object.keys(value).length === 0`: zero own
entries is exactly what `{}` and `/x/` have in common, and they need opposite
answers. An empty operator object stays the TRUE identity and constrains nothing;
a null-prototype bag and a cross-realm plain object are still read as operator
maps; `Date` comparands still lower (objectui#8555); operator objects, `$in` /
`$nin` / `$between` members, `$null` / `$exists`, `$and` / `$or` groups and the
`$regex` / `$not` / bare-array refusals are all exactly as they were.

⚠️ **Dated note, 2026-09-27 — an empty operator object ALONE is now refused — objectui#9164.**
Later in this same release an empty operator map that is all a filter says
(`{ created: {} }`) is refused with a `FilterOperatorError` rather than returned as the
object. Beside a key that lowers it still constrains nothing — the case this entry's
control pins — and it is still never read as an exotic comparand. The rest of this entry
is kept as the reading of this change; the objectui#9164 entry states what that input now
answers.

⚠️ **Dated note, 2026-09-27 — an empty operator object BESIDE a key is now refused too — objectui#10788.**
Later in this same release an empty operator map beside a key that lowers
(`{ status: 'a', created: {} }`) is refused with a `FilterOperatorError` naming the field
instead of constraining nothing, because `@objectstack/spec` records `{ field: {} }` as
REJECTED (objectstack#5240). It is still never read as an exotic comparand: the refusal is
the empty-operator-map one, not this entry's. "An empty operator object stays the TRUE
identity and constrains nothing" above, and "Beside a key that lowers it still constrains
nothing" in the objectui#9164 note, are this change's reading, not the release's. The rest
of this entry is kept as the reading of this change; the objectui#10788 entry states what
that input now answers.
