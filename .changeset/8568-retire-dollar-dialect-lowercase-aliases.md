---
'@object-ui/core': minor
---

`convertFiltersToAST` follows `@objectstack/spec`'s `$`-dialect spellings and nothing
else: the four lowercase aliases `$notin`, `$notcontains`, `$startswith` and `$endswith`
are retired from `convertOperatorToAST`'s `operatorMap` (objectui#8568).

**BREAKING for anyone spelling those four in lowercase, and there is no deprecation
window.** A filter that carries one used to lower silently — `{ email: { $startswith:
'a' } }` became `['email', 'startswith', 'a']` — and now throws a `FilterOperatorError`
(`code: 'INVALID_FILTER'`, `httpStatus: 400`) at the call site. This repo forbids a
`major`, so the break ships as a `minor` and is spelled out here instead. The repair is
a key rename: `$notin` to `$nin`, `$notcontains` to `$notContains`, `$startswith` to
`$startsWith`, `$endswith` to `$endsWith`. The operator itself is unchanged, the lowered
node is unchanged, and no result set moves for a filter that was already spelled
canonically.

**Why the tolerance had to go.** `ValueDataSource` refuses these same four by design —
objectui#8447 declined to grow alias arms there because they "would fossilise a second
dialect" — so one authored filter had two fates depending on which data source was
behind the view: rows through the ObjectStack adapter, nothing through the in-memory
matcher. One dialect with two acceptance sets is the second de-facto contract AGENTS.md
commandment 0.1 exists to refuse, and the decision had only ever reached one of the two
files. `ValueDataSource` is untouched by this change; the converter is the side that
moved.

**The refusal names the canonical spelling for the alias you wrote** rather than
printing the generic "unknown operator, here are the supported ones". With no
deprecation window that message is the whole migration aid, so it is pinned as a
property, not left as a nicety.

**Measured before landing, and it bounds the blast radius from the inside.** The in-repo
authored corpus (examples, docs, apps, e2e, fixtures) carries **zero** occurrences of the
four aliases in operator-key position — every tree-wide hit is the map that defined them
or something pointing at it — so no in-repo caller had to be repaired. That zero is
consumer-local, not seam-wide (objectui#6839): stored view / list / sharing-rule
criteria, producer-side metadata and published consumers of `@object-ui/core` are all
invisible from here. What is measurable about that population is that it is already half
broken: `kvToCondition`, the reader that loads stored `$`-criteria back into the filter
builder, has arms for fifteen spellings and none of these four, so a stored lowercase
criterion already failed to round-trip and dropped the admin into the raw-JSON editor.

`packages/data-objectstack/README.md`'s operator tables follow the implementation, as
does the reconciliation test that holds them to it.
