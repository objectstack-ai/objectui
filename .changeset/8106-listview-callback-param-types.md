---
'@object-ui/plugin-list': minor
---

`ListViewProps.onSortChange` and `onFilterChange` are declared at the types they
actually fire with, instead of `any`.

Both were left `any` by the objectui#4528 sweep that named every other prop on
this interface "at the type each one actually lands on". `dataSource?: any`
carries its own written justification right there; these two carried none, which
is what made this an oversight rather than a decision. The visible cost was that
the package README's documented "With Callbacks" example compiled green on all
four callbacks while only two of them were constrained by anything: assigning
`view` or `search` to a `number` inside the block raised TS2322, and assigning
`sort` or `filters` raised nothing at all.

Each parameter was measured at the emit site rather than read off the
declaration, and the two are asymmetric:

- `onSortChange` now takes `SortItem[]`. Every emit in the component crosses one
  boundary, `emitSortChange`, and both of its legs carry that element type: the
  array handed in, and `filterPlatformSortableSort`'s return, which is generic in
  the element and so preserves whatever it is given. Normalized-vs-raw therefore
  does not move the type here, only whether platform-unsortable entries are still
  present.
- `onFilterChange` now takes `FilterGroup`. Its one call site passes the toolbar
  `FilterBuilder`'s own `onChange` value straight through, beside a
  `setCurrentFilters` that is itself state of that type. It is deliberately NOT
  the filter AST `normalizeFilters` / `buildEffectiveFilter` speak — those run
  later on the query-building path and nothing they produce reaches this
  callback. A host receives the builder's group verbatim, which is what lets it
  round-trip back in through `initialFilters`.

Both types were already exported from `@object-ui/components` and already
imported by this file; nothing new is minted.

Narrowing a callback parameter is contravariant, so the cost falls only on
handlers that did something with the parameter that `any` alone allowed — a
handler written `(sort: any) => ...` still compiles unchanged. The cost was
measured across every in-repo consumer that passes either callback
(`ObjectView`, in two places, and `InterfaceListPage`) plus every package that
imports `ListView` at all (`@object-ui/app-shell`, `@object-ui/plugin-map`,
`@object-ui/console`): all of them still type-check, and no handler needed
touching. Out-of-repo hosts that destructure or index the parameter in ways only
`any` permitted will now see a real error, which is the point.
