---
'@object-ui/types': minor
---

`showFilters` is retired on `object-grid` (objectui#11068).

**BREAKING (authoring).** An `object-grid` that carries `showFilters` now fails validation,
and TypeScript code that writes it on an `ObjectGridSchema` no longer compiles. Delete the key.

**What was wrong.** `ObjectGridSchema` declared `showFilters`, but an `object-grid` has no filter
UI and never read the key. An author who wrote `showFilters: true` on a grid got no type error,
no validator refusal and no filter.

**Where filtering lives.** The filter builder is the `list-view` toolbar's. Author a `list-view`
and switch the builder with its `userActions.filter`. To narrow the rows a grid fetches, write
`filter` on the grid.

**How it is refused.** The key is `?: never` on the `ObjectGridSchema` interface and a named
refusal on its Zod twin. On both authoring faces, the node face and the strict authoring face,
the message names the key and `userActions.filter`. This matches the upstream protocol, whose
`object-grid` row does not declare the key either.

**Unchanged.** An `object-view`'s own `showFilters` and a `list-view`'s are different keys, and
both are still accepted. `ObjectView` reads its own, and `ListView` folds its own onto
`userActions.filter`. An `object-view`'s `table` slot already refused `showFilters` and still
does.
