---
'@object-ui/core': patch
---

fix(core): `ValueDataSource.find` reads a spec `ViewFilterRule[]` `filter`, so an inline-data map, tree, calendar or gantt renders the rows the one filter form the spec accepts selects

The spec's converged `filter` doors accept ONLY the rule array
`[{ field, operator, value }, …]` (objectui#6206 B). `ValueDataSource.find` picked a
matcher on the SHAPE of `$filter` — an object to the `$`-dialect matcher, an array
to the AST matcher — and a rule OBJECT is none of the AST shapes, so every row was
refused with one `console.warn` ("is not a shape the matcher reads"). The four
blocks whose rows can be inline (`object-map`, `object-tree`, `object-calendar`,
`object-gantt`, the last through `resolveDataSource`) hand `schema.filter` to this
adapter unlowered, so a spec-conformant page with inline rows rendered an EMPTY
component while `os validate` was green.

The array arm now lowers through the repo's ONE sink, `toFilterNode`
(`toFilterNodeSafely`) — the same function the grid, the list and every other
lowering caller already use — before it matches, so the spec's vocabulary
(`equals`, `greater_than`, the aliases the spec folds, a valueless `is_null`) selects
rows in memory exactly as it does on the wire. No second lowering and no second
operator table were added; the `$`-dialect arm is untouched.

The matcher is NOT relaxed. An empty rule array is still "no filter" (as on the
object-bound arm). A genuinely unreadable node, an operator the vocabulary does not
know, and a rule the lowering itself refuses (an ARRAY on a single-valued operator,
an empty `icontains` comparand) still exclude every row and log ONCE, with the same
sentence tail — the lowering's refusal is delivered the way this adapter delivers
every refusal, excluded and logged, never thrown.

`QueryParams.$filter` (`@object-ui/types`) already declared the array form legal for
every DataSource and named the wire adapter's `translateFilterToAST` as the accept
set; this adapter was the one face in the family that did not read the rule array,
so `resolveDataSource` handed back an adapter whose `find` read fewer filter shapes
on `provider: 'value'` than on `provider: 'object'`. That gap is what closed.
