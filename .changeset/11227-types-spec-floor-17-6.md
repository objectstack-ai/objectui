---
'@object-ui/types': patch
---

Raise `@object-ui/types`' declared `@objectstack/spec` floor from `^17.5.0` to
`^17.6.0` (objectui#11227). The package's published types now read
`EmptyState` from `@objectstack/spec/ui`, because the `object-grid`
`emptyState` member is typed by reference to the protocol's own shape, and its
published zod mirror reads `EmptyStateSchema` from the same subpath. Neither
export exists in `@objectstack/spec` 17.5.0, which the old range admitted; both
ship from 17.6.0. A consumer resolution landing on 17.5.0 therefore got types
and a mirror that name exports their declared spec dependency does not have.

Nothing moves at runtime in this repository: the lockfile already resolves
`@objectstack/spec` 17.6.0 for this specifier, so only the declared range was
stale. For a consumer, the range now refuses `@objectstack/spec` 17.5.0. The
instrument that re-derives this floor is `pnpm check:spec-floors`, read over a
full workspace build.
