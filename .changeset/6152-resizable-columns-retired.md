---
'@object-ui/types': minor
'@object-ui/plugin-grid': minor
---

feat(types)!: retire `object-grid`'s `resizableColumns` on both faces, and stop `ObjectGrid` reading it (objectui#6152, round 7)

**Retired (breaking).** `resizableColumns` was the legacy second spelling of `resizable` on
`object-grid`, read only when `resizable` was absent. `@objectstack/spec` 17.7.0 retired it in the
`object-grid` row (objectstack#21445), so an authored document that writes it, flat on the node or
inside its `properties` bag, was already refused by name before this change. This change retires
the rest of it, with no alias window:

- `@object-ui/types`: `ObjectGridSchema.resizableColumns` is now `?: never`, so writing it on a
  typed literal is a `tsc` error. The flat zod `ObjectGridSchema` in `@object-ui/types/zod` (the
  node as `ObjectGrid` reads it after the `properties` hoist, or as code composes it) refuses the
  key by name at the key, where `.passthrough()` used to keep it unexamined. The refusal names
  `properties.resizable`.
- `@object-ui/plugin-grid`: `ObjectGrid` reads `resizable` alone. A node that still carries
  `resizableColumns` (one composed in code, past the type) now gets the default, resizable
  columns, as if it had written nothing: `resizableColumns: false` no longer turns the column
  resize handles off. The `object-grid` registration's `resizable` input no longer describes the
  old spelling as a fallback.

Rename the key to `resizable`; on an authored node, that is `properties.resizable`.

An `object-view`'s `table.resizableColumns` is unchanged: the slot already refused it by name.
