---
'@object-ui/types': minor
---

`FilterBuilderOperator` is no longer exported from this package (objectui#6349, batch 12). It was `@objectstack/spec`'s `ViewFilterOperator`, the protocol's canonical view-filter ids, under a second name. `@object-ui/components` publishes its own `FilterBuilderOperator`: the builder's vocabulary, those ids plus the opt-in `exists` / `notExists`, which the objectui#9306 ruling keeps under that name. So one import name stood for two operator sets. `FilterBuilderCondition.operator` is now typed by the spec's `ViewFilterOperator` directly, and it is the same set as before. `FilterBuilderCondition` and `FilterGroup` keep their names and shapes. Their doc comments now name `@object-ui/components`' derived `FilterBuilderRow` and `FilterBuilderRowGroup`.

**Type change, breaking for some consumers.** Replace `import type { FilterBuilderOperator } from '@object-ui/types'` with `import type { ViewFilterOperator } from '@objectstack/spec/ui'`. It is the same union. Inside this package's types you can also write `FilterBuilderCondition['operator']`. The old import fails to compile with TS2305.

No runtime behaviour changes.
