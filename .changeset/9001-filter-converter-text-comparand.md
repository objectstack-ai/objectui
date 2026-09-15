---
'@object-ui/core': minor
---

`convertFiltersToAST` refuses the two `$icontains` comparand shapes the contract
declares refused, instead of lowering them onto the wire (objectui#9001).

`@objectstack/spec`'s `FILTER_TEXT_CASES` carries an empty `$icontains` comparand and a
non-string one as REJECTION rows, each with `code: 'INVALID_FILTER'` and
`mustMention: ['$icontains']`. `ValueDataSource` has answered both since objectui#8748
(`refuseTextComparand`); this converter answered neither. Measured with both faces in
one process, `{ name: { $icontains: '' } }` and `{ name: { $icontains: 42 } }` were
refused by the in-memory matcher and lowered to `['name', 'icontains', '']` /
`['name', 'icontains', 42]` by the ObjectStack path — one authored filter with two
fates, decided by which data source happened to be behind the view. That is the
acceptance-set split objectui#8568 and objectui#8976 each closed on the operator-KEY
axis, here on the COMPARAND axis.

Both shapes now raise the `FilterOperatorError` this file already uses for `$regex`,
`$not`, the retired aliases and three other comparand shapes — `code: 'INVALID_FILTER'`,
`httpStatus: 400`, which `classifyLoadError` renders as "this filter is malformed"
rather than as a network fault. The refusal is a PORT of `refuseTextComparand`, not a
second design: the discrimination and the message text are the sibling's, because
`mustMention` makes the wording part of the contract rather than a stylistic choice, and
a test drives both faces and pins the converter's message to contain the matcher's
refusal verbatim so the mirror cannot drift in silence. What deliberately does not
transfer is the DELIVERY: the matcher excludes-and-logs because it is deciding about one
row, while this function is the producer deciding whether to send a query at all and has
no row to exclude.

**This narrows what the converter accepts, and that is the point.** A caller that hands
it `{ field: { $icontains: '' } }` gets a refusal where it used to get a lowered node.
Nothing was relying on the old answer to select rows: the empty comparand is a predicate
that constrains nothing, so the node either widened a list to every row or — for the
non-string comparand — asked the backend a question nobody wrote after a coercion nobody
requested. `@object-ui/data-objectstack`'s `translateFilterToAST` delegates its object
branch to this function, so its `$`-dialect route inherits the refusal without a source
change of its own.

**Migration.** A producer that can emit an operator row with an empty value box must drop
the condition rather than send it — the same repair the refusal message prescribes.
`FilterConditionField` already does this (objectui#8748 shipped the producer half). The
sibling positive operators `$contains` / `$startsWith` / `$endsWith` are untouched: the
table declares no such row for them, and widening by analogy is the published table's
decision, not this converter's.
