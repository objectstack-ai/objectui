---
'@object-ui/core': patch
---

The TRUE-identity fold now counts only the keys the loop PROCESSED, so a filter
that mixes an identity group with a skipped key folds too (objectui#9030).

`convertFiltersToAST` folds a filter that is nothing but TRUE-identity
combinators to `undefined` (objectui#8770), and folds a filter whose every key
the loop SKIPPED for a `null` / `undefined` value to `undefined` too
(objectui#9020). Each fold compared its own count with
`Object.keys(filter).length`.

But the loop's first statement skips the null/undefined keys without
incrementing anything the identity fold counts, while that denominator counted
them anyway. So a filter carrying one identity group beside one skipped key read
`1 === 2`, the fold declined, and the caller's original object came back — even
though each of its keys, taken alone, folds:

```
{ $and: [] }                ->  undefined         folded
{ b: undefined }            ->  undefined         folded
{ $and: [], b: undefined }  ->  { $and: [], … }   did NOT fold
```

Behaviour decided by a sibling, read the other way round: adding an always-TRUE
`$and: []` to a filter that folded could stop it folding.

What that cost, measured on both `find()` routes of `@object-ui/data-objectstack`
rather than assumed. The plain route hands a non-AST object to
`client.data.find`, whose else-branch spreads its entries as query parameters, so
`{ $and: [], b: undefined }` left as `?$and=` with no `filter` parameter at all —
the `400 UNSUPPORTED_QUERY_PARAM` objectui#8770 exists to end. The
`$expand` / `$search` route JSON-serialises the same object into `filter=`, where
`{ $and: [], a: null }` arrived carrying a real `a IS NULL` predicate the
converter had already decided contributes nothing. One authored filter, two row
sets, and neither matched the converter's own answer for either key alone.

The denominator is now the count of keys the loop actually processed — every key
minus the ones its own first statement skipped. Both skipped spellings come
along, because the loop skips them with one statement and objectui#9020 already
ruled what that skip means when it is all that is left.

**Unchanged, and pinned as controls in the same run:** the null/undefined skip
itself (`{ a: null, s: 1 }` still lowers to `['s', '=', 1]`); the FALSE identity
`{ $or: [] }`, which still selects no row; an identity group beside a key that
does lower (`{ $and: [], a: 'x' }` still lowers to `['a', '=', 'x']`); a plain
filter's AST; and the object tail, which still serves `{}`, an empty operator map
`{ a: {} }`, and an empty operator map beside a skipped key — a key the loop
ENTERED and that produced no condition is neither an identity group nor a skipped
key, so no arm claims it. The two counts stay apart; only one denominator moved.

This supersedes one sentence in objectui#9020's own entry above, which named
`{ $and: [], a: null }` as still returning the object and objectui#9030 as the
open question about it.
