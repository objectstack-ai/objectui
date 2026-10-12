---
'@object-ui/components': minor
---

The FilterBuilder's row and group types are exported as `FilterBuilderRow` and `FilterBuilderRowGroup` instead of `FilterBuilderCondition` and `FilterGroup` (objectui#6349, batch 12). `@object-ui/types` publishes `FilterBuilderCondition` and `FilterGroup` as the authored row and group, and it is the single name authority for both (objectui#9306). This package derives its two types from those declarations and keeps the ruled extensions on the row: `operator` is this package's `FilterBuilderOperator` (the protocol's ids plus the opt-in `exists` / `notExists`), and `value` is required and narrowed to what the builder edits. Under the same names, one import name stood for two shapes that are assignable to each other in neither direction. The two types are unchanged; only their names move. `FilterBuilderOperator` keeps its name.

**Type change, breaking for some consumers.** `FilterBuilderCondition` and `FilterGroup` are no longer exported from `@object-ui/components`:

- Replace `import type { FilterBuilderCondition } from '@object-ui/components'` with `FilterBuilderRow`. The old import fails to compile with TS2305.
- Replace `import type { FilterGroup } from '@object-ui/components'` with `FilterBuilderRowGroup`. The old import fails to compile with TS2724, and that error's "Did you mean 'ItemGroup'?" names an unrelated component. Write `FilterBuilderRowGroup`.

Each replacement is the same type as before: `FilterBuilder`'s `value` and `onChange` and the exported value helpers keep their shapes. To type an authored filter (a `filter-builder` node's `value`), import `FilterGroup` and `FilterBuilderCondition` from `@object-ui/types`.

No runtime behaviour changes.
