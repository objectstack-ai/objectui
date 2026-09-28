---
'@object-ui/types': minor
---

`safeValidateSchema` — and so `objectui validate` — accepts three more registered node types: `pivot`, `object-metric` and `object-master-detail-form` (objectui#10859, batch 2).

**Clause-②: yes** — the accept set of `AnyComponentSchema` widens by three `type` literals, and `@object-ui/types/zod` exports four new schemas. Nothing that parsed before is refused now: every document naming one of these types was refused at `type`, at the root and at every child slot.

**What it was.** `pivot` is registered by `@object-ui/plugin-dashboard` and declared on the published TypeScript face (`PivotTableSchema`); `object-metric` and `object-master-detail-form` are ADR-0080 public blocks, registered by `@object-ui/plugin-dashboard` and `@object-ui/plugin-form`, whose props `@objectstack/spec` declares as `ComponentPropsMap` rows. `AnyComponentSchema` carried no arm for any of them, so every document naming one was refused with `invalid_union` at `type` — the objectstack showcase's own `object-metric` KPIs and its master-detail form page included.

**What changed, in observable terms.**

- `@object-ui/types/zod` exports `PivotTableSchema`, a member for member restatement of the TypeScript `PivotTableSchema`: `rowField`, `columnField`, `valueField` and `data` are required, as they are there; `aggregation` is one of `sum`, `count`, `avg`, `min`, `max`; `drillDown` is the shared `DrillDownConfigSchema`; `body` and `children` are refused by name, as the declaration's `?: never` members refuse them (objectui#9256). `DataDisplaySchema` lists it.
- `@object-ui/types/zod` exports `ObjectMetricBlockSchema` and `ObjectMasterDetailFormBlockSchema`, built the way the objectui#10872 public-block arms are: `BaseSchema`, the `type` literal, and `properties`, which is the block's `ComponentPropsMap` row by reference, so the spec's members, value types and strictness apply to the bag unchanged. `ObjectMasterDetailFormBlockSchema` also refuses `onSuccess`, `onError` and `onCancel` by name: they are runtime slots a React host fills (objectui#6124). Both reach `AnyComponentSchema` through a new union, `ObjectQLPublicBlockComponentSchema`.
- The strict authoring face (`StrictAnyComponentSchema`) derives from `AnyComponentSchema` and accepts the same three types, closed to undeclared keys like every other arm. As on the public blocks, a prop written flat on an `object-metric` or `object-master-detail-form` node instead of inside `properties` is not judged against the spec row. A key `BaseSchema` does not declare passes the tolerant face unjudged and is refused by name on the strict face; a key it does declare (`label` and `description`, both also members of the `object-metric` row) is judged by `BaseSchema`'s own type on both faces.
