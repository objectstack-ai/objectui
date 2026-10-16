---
'@object-ui/plugin-grid': minor
---

The per-group aggregation type that `useGroupedData` takes is declared and exported as `GroupAggregationConfig` instead of `AggregationConfig` (objectui#6349, batch 7). `@object-ui/types` publishes a different `AggregationConfig`: the query-AST aggregation `DriverQueryConfig.aggregations` carries (`function`, `alias`, `distinct`, `separator`). The two shared only `field`, so one exported name stood for two contracts across the two packages.

**Type change, breaking for some consumers.** `AggregationConfig` is no longer exported from `@object-ui/plugin-grid`. Replace `import type { AggregationConfig } from '@object-ui/plugin-grid'` with `GroupAggregationConfig`; the members (`field`, `type`) are unchanged. The compiler names the replacement (TS2724, "Did you mean 'GroupAggregationConfig'?"). `AggregationType` and `AggregationResult` keep their names. The README's export list now names `GroupAggregationConfig`.

No runtime behaviour changes.
