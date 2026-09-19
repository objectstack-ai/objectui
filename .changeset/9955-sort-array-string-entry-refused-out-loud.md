---
'@object-ui/core': patch
---

fix(core): refuse a retired string `sort` ENTRY out loud instead of dropping it in silence

`convertSortToQueryParams` / `normalizeSortEntries` already refused the retired scalar
clause (`sort: 'name asc'`) with a prescription naming the array form. The same clause one
container deeper — `sort: ['name asc']` — fell through the array arm's skip, returned
`undefined`, and printed nothing, so an authored row order disappeared with no trace in the
console while its neighbouring spelling got a full correction.

A string entry is now named by its own `console.error`, deduped per spelling like its scalar
sibling. The message carries the worked array-of-objects example, says `order` is required at
publish, and keeps the ascending default stated as a runtime tolerance rather than as
permission to omit the key.

⛔ No input starts being accepted: `['name asc']` still contributes no ordering, per
objectui#8221 (one `sort` spelling, the array, everywhere). Mixed arrays are unaffected —
`[{ field: 'a', order: 'asc' }, 'b desc']` still orders by `a`, and the message says so
instead of claiming the query lost its ordering. The `field`-less object entry keeps its
declared silence.
