---
---

Test-only change (objectui#9203): adds a drawn dashboard-seam pin for the five
plot-internal `chartConfig` keys the DATASET face forwards — `colors`,
`categoryColors`, `showDataLabels`, `annotations`, `interaction` — and corrects
the three header comments that cited `plugin-charts`'
`ChartRenderer.dashboardChartConfig.test.tsx` as that face's coverage. No
published behaviour changes; every file touched is a test.
