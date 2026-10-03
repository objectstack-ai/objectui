---
---

Test-only change in `@object-ui/types`; no published behaviour changes. The spec-object refinement census in `spec-object-refinements-7715.test.ts` books `checkDashboardWidgetDimensionlessMeasureArity` on its `DashboardWidgetSchema (complex.zod.ts)` row as owed to objectui#11334, with an expiry, under objectui#11438 ruling A″. The test sits under `src/__tests__/`, which the package's `tsconfig.json` excludes from the published `dist`.
