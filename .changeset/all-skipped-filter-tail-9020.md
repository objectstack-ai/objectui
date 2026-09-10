---
'@object-ui/core': patch
---

An all-skipped filter now says "no constraint" instead of handing back the caller's
object (objectui#9020).

`convertFiltersToAST` skips a key whose value is `null` / `undefined`. That is
long-standing, pinned, and **unchanged**: `{ a: null, s: 1 }` still lowers to
`['s', '=', 1]`. What changed is the answer when the skip leaves nothing behind.
The general tail used to return the CALLER'S ORIGINAL OBJECT, and that object
meant two different things on the two `find()` routes of
`@object-ui/data-objectstack` — measured against `@objectstack/spec` 17.4.0 and
`@objectstack/client` 17.4.0:

```
plain  route   GET /data/acct                        ->  EVERY row
expand route   GET /data/acct?populate=…&filter={"a":null}  ->  the a = null rows
```

The plain route hands the value to `client.data.find`, whose non-AST branch
spreads a plain object's entries as query parameters and SKIPS the null ones, so
nothing at all was appended. The `$expand` / `$search` route JSON-serialises the
same object into `filter=`, and `{ a: null }` is a well-formed `FilterCondition`
the spec accepts (`null` is in `ACCEPTED_FILTER_COMPARAND_TYPES`), so it arrived
as a real predicate. One authored filter, two row sets, and the deciding input
was whether the query happened to want a lookup expanded — which is also why it
was self-inconsistent within one route: the key meant "no constraint" the moment
any sibling produced a condition and meant a predicate when it was alone.

The tie is broken by what the function already says about the key rather than by
inventing a meaning for it: the loop's `continue` is the ruling, so carrying it
to the wire is `undefined`. `toFilterNode` and `mergeFilterNodes` inherit that,
so such a filter is now skipped rather than landing in AST child position, where
`isFilterAST` refused it and the whole list answered 400.

An author who MEANT the predicate spells it `{ a: { $null: true } }` ->
`['a', 'is_null', true]`, on both routes, as before.

Same ANSWER as objectui#8770's TRUE-identity fold, deliberately not the same
state: they are two counts and two guards, so a filter that MIXES the kinds
(`{ $and: [], a: null }`) still returns the object — objectui#9030's open
question, untouched here.
