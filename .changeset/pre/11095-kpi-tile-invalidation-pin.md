---
---

No package released: tests and one doc comment, no behaviour change. `@object-ui/plugin-dashboard` gains a pin that a dataset-bound KPI tile (a `metric` widget with no dimensions) re-reads on the data-invalidation bus once its query's answer names the dataset's base object. The answer names it on every dataset query since objectstack-ai/objectstack#20644, which `@objectstack/spec` 17.6.0 declares as `AnalyticsResult.object`. The widget already subscribed on that key, so no executable code changed (objectui#11095).

`@object-ui/app-shell`'s `refreshDashboardData` doc comment stops describing that gap as current. The comment is not inert text: `tsc` keeps it in the emitted `dist/views/DashboardView.js`, which is published. It sits above a non-exported function, so it is in no `.d.ts`. It changes no export, type or behaviour, so it releases nothing and ships with the next release of the group.
