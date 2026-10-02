---
---

Tests only, no package released: the objectui#11417 TIE pin in `@object-ui/plugin-dashboard`
(`DatasetWidget.singleSeriesMeasures-11417.test.tsx`) now reads a chart's markup only after the
legend has drawn its items. Recharts delivers a pie's legend items one animation frame after the
surface and sectors land, so under load a read could catch an empty `recharts-legend-wrapper`.
That made "the same rows rendered twice" differ on CI and could flip the TIE's `secondDrawn`
reading the same way (objectui#11459). The determinism control still compares the whole markup.
