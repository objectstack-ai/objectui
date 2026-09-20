---
---

Bind `@object-ui/components`' `SortDirection` to `@objectstack/spec` (objectui#7265,
the `@object-ui/components` slice of the `check:spec-symbols` DEBT burn-down).

The DataTable renderer declared `SortDirection` module-locally, under the exact
name `@objectstack/spec/shared` exports — the planted-premise class that guard
exists to stop. It now imports the spec's own type. The `null` third state the
declaration carried is not a third direction but the absence of one, so it is
spelled `| null` at the single state slot that holds it, the way `sortColumn`
already spelled its own empty case, with the reason written there.

Type-only. `import type`, a deleted type alias and an erased `useState` type
argument leave the emitted JavaScript byte-identical and the package's `.d.ts`
unmoved — the declaration was never exported, so nothing published moves and no
package is released by this change.
