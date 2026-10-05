---
---

Tests only, no package released: `@object-ui/plugin-dashboard` gains a pin that a dataset-bound KPI tile (a `metric` widget with no dimensions) re-reads on the data-invalidation bus once its query's answer names the dataset's base object. The answer names it on every dataset query since objectstack-ai/objectstack#20644, which `@objectstack/spec` 17.6.0 declares as `AnalyticsResult.object`. The widget already subscribed on that key, so no source changed (objectui#11095).
