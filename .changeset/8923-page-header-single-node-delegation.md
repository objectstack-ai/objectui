---
'@object-ui/components': patch
---

Fix: a `page:header` authored as a SINGLE-NODE `body` (or `children`) no longer leaves
the page drawing a duplicate `h1` (objectui#8923).

`PageRenderer` delegates its implicit heading to an authored `page:header` so a document
has exactly one `h1` (objectui#3434). The predicate that decides this,
`containsTitledPageHeader`, opened with an early `return false` for anything that is not
an array. `PageNodeSchema.body` and `.children` are declared `SchemaNode | SchemaNode[]`,
so a page whose `body` is one bare node — the arity the root `README` flagship example
authors — took that early return: the page emitted its own `h1` next to the one the
header rendered. A screen reader announced the title twice and it was visibly duplicated.

The hole was per recursion level, not only at the top: the walk feeds each node's nested
`body` / `children` back into the same early return, so a bare-node hop anywhere in the
chain ended the search. Measured, not read: before the change the top-level case rendered
2 `h1` elements, as did a bare hop at depth 1, 2 and 6.

The repair normalises the arity once, at the predicate's entry, the way `FlatContent` in
the same file has always widened these two keys — so `regions[].components`, `body` and
`children` are judged by one rule instead of three call sites each remembering
`Array.isArray`. The `depth > 6` bound is unchanged: the widening happens inside the same
invocation as the depth check, so it spends no budget.

Deliberately unchanged: a `page:header` whose title renders no literal text (absent,
empty, or `'{name}'` interpolating to nothing with no record in scope) still does NOT take
the page's heading away — suppressing ours there would leave the page with zero `h1`.
