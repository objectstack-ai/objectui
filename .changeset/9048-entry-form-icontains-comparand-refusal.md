---
'@object-ui/data-objectstack': patch
---

fix(data-objectstack): the rule-entry filter form refuses an empty or non-string `icontains` comparand

`@objectstack/spec`'s `FILTER_TEXT_CASES` declares two shapes REFUSED for the
case-insensitive contains operator: an empty comparand, and one that is not a
string. This adapter already refused both when a filter arrived as an object
(`{ name: { $icontains: '' } }`), but a filter in the rule-entry form
(`[{ field: 'name', operator: 'icontains', value: '' }]`) was lowered to
`['name', 'icontains', '']` and sent. So the same condition was refused or sent
depending on which form it was written in. An empty comparand matches every
row, so the entry form returned the whole table where the author asked for a
subset.

The entry form now asks the spec's own `isRefusedTextComparand` after the
operator alias fold, so a case variant such as `ICONTAINS`, or the operator
given under the `op` key, is judged too. It throws `MalformedFilterError`
(`INVALID_FILTER` / 400) carrying the spec's `textComparandRefusalReason`
unchanged, before any request is sent, on `find()` (both routes) and on
`aggregate()`, and for a rule nested under a logical node as well as at the top
level. `convertFiltersToAST` and `ValueDataSource` read the same two functions,
so all three now refuse the same set: an empty string and any non-string,
including a missing `value`. A missing value used to go out as JSON `null`.

`MalformedFilterError`'s public signature is unchanged: the refusal sentence is
seated inside this module. Building its message no longer throws for an entry
that carries a BigInt (such a value is shown as its literal, e.g. `3n`), and its
text is otherwise the same as before. The README's "Rule-shaped arrays" section
documents the refusal. The case-sensitive `contains` family is untouched: the
table declares no such row for it.
