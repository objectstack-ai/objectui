---
'@object-ui/app-shell': patch
---

A URL filter operator suffix naming an inherited member is no longer an operator
(objectui#9507).

`parseUrlFilterTriples` — the reader behind the ADR-0055 bare data surface's
`filter[<field>][<op>]=<value>` URLs — decided "is this suffix an operator" by
indexing `URL_FILTER_OPS` with the suffix and testing the result for truthiness.
The map was a plain object literal and the suffix comes from the address bar, so
that question was also answered by `Object.prototype`: `filter[amount][constructor]=1`
resolved to `Object.prototype.constructor`, passed the guard, and emitted a filter
condition **whose operator was a JavaScript function**. `[toString]` and
`[hasOwnProperty]` did the same; `__proto__` was the same defect in a second shape,
its inherited accessor yielding `Object.prototype` itself, so that suffix produced
an operator that was an object. `filter[amount][nope]=1` was always correct — it
produced nothing, which is the documented behaviour this repair restores for the
inherited names: the function's own contract says an unknown operator suffix is
ignored, never silently downgraded to equality, and for these suffixes it was
neither.

**What a reader saw before the repair**, driven once per consumer of these triples
and recorded here because none of the three was a crash:

- the **filter-chip row** fell through the range arms of `groupFilterChips` to the
  `= <value>` default and drew a confident `amount = 1` chip — the silent downgrade
  to equality the contract rules out, rendered as if the user had asked for it;
- **"Save as view"** dropped the condition rather than persisting it (a function is
  not a string, so it survives `normalizeFilterOperator` unchanged and
  `ViewFilterRuleSchema` refuses it) and saved a view carrying no `filter` key at
  all — so the saved view silently disagreed with the chip the user had just read.
  A malformed operator could **not** reach stored view metadata;
- the **list query** passed the triples to `toFilterNode` untouched and
  `JSON.stringify` turned the function into `null` on the wire, sending the data
  layer a condition with no operator in it.

The repair removes the construction rather than naming the members: `URL_FILTER_OPS`
has no prototype, so an own entry is the only thing a lookup in it can find. A
denylist of `constructor` / `toString` / `hasOwnProperty` was considered and refused
— it is a spelling-level patch that the next member of a prototype this module does
not own walks straight past.

**Nothing on the exported face moves.** `URL_FILTER_OPS` keeps its name, its
`Record<string, string>` type and its four entries (`gte` `lte` `gt` `lt`), and
behaves identically under spread, `Object.keys` and `Object.entries` — which is how
`ObjectDataPage` inverts it to bridge a triple's operator to the spec's alias
spelling. The four declared operators are asserted to still resolve, beside a sweep
that enumerates `Object.prototype` at run time rather than listing today's members,
so a member added to the language is covered without anyone remembering to.
