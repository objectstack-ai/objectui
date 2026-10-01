---
---

Comments and tests only, no package released for `@object-ui/core` or `@object-ui/plugin-charts` (objectui#11315).

- `@object-ui/core`: `chart-presentation.ts` comments now state that a dashboard widget's `chartConfig`
  no longer carries `type` / `xAxis` / `yAxis` / `series` (`@objectstack/spec` 17.5.0) and that
  `chartConfig.aria` is a spec tombstone. `mergeAuthoredPresentation` keeps its signature and its
  behaviour; the dashboard widget no longer calls it, and that rendering change is declared in
  `@object-ui/plugin-dashboard`'s changeset.
- `@object-ui/plugin-charts`: a new pin, `ObjectChart.inlineComboSeries-11315.test.tsx`, records that the
  react `ObjectChart` tier still draws an authored `series` as a combo. No source changed.
