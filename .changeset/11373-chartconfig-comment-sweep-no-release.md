---
---

Comments and docs only, no package released (objectui#11373).

Source comments in `@object-ui/plugin-dashboard`, `@object-ui/plugin-report` and `@object-ui/types`, comments in
`@object-ui/plugin-dashboard` tests, and the `plugin-charts` docs page no longer describe a dashboard widget's
`chartConfig` as carrying `xAxis` / `yAxis` / `series`, an open precedence question about them, or
`mergeAuthoredPresentation` as a function that exists. `@objectstack/spec` 17.5.0 refuses those keys on a dashboard
widget, the react `ObjectChart` tier keeps them, and objectui#11372 removed `mergeAuthoredPresentation` from
`@object-ui/core`. No code changed. The pending `dashboard-inline-chartconfig-4044` changeset's reasons for the keys
the inline relays do not forward are corrected the same way.
