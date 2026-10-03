---
'@object-ui/types': minor
---

`DashboardWidgetSchema['type']` names the widget vocabulary only, `DashboardWidgetTypeName`: it drops `DashboardComponentWidgetType` (objectui#11514). This narrows the TypeScript face. `minor`, per this repository's version alignment; the narrowing is the breaking part.

**Clause-②: no (narrowing)** — nothing the TypeScript face refused is accepted now, and no validator face moves.

- **What changed.** The widget arm's `type` is the same set as its zod twin's, `DashboardWidgetTypeSchema`, which dropped the component type in objectui#11483. The TypeScript interface kept it then because it was also the read type of every `widgets[]` entry. `@object-ui/plugin-dashboard`, `@object-ui/plugin-designer` and `@object-ui/app-shell` now read an entry by the slot's element type, `DashboardComponentSchema['widgets'][number]`, so the widget arm no longer has to admit `metric-card`.
- **What now refuses that did not.** `tsc` refuses a `metric-card` with no `value` directly in `widgets[]`, as both validator faces already did: only the component arm, `DashboardWidgetSlotComponentSchema`, names `metric-card`, and its `value` is required. Assigning `type: 'metric-card'` to a `DashboardWidgetSchema` is a compile error. The component arm is no longer assignable to `DashboardWidgetSchema`, so a callback annotated `(w: DashboardWidgetSchema)` over `schema.widgets`, or a `DashboardWidgetSchema[]` annotation on it, stops compiling.
- **Fix.** Annotate an entry with `DashboardComponentSchema['widgets'][number]`. To read a widget key with its declared type, narrow the entry on `type` first: `metric-card` is the one component type the slot holds, and any other entry is the widget arm.
- **What does not move.** No zod schema, validator verdict, export name or runtime behaviour. `DASHBOARD_COMPONENT_WIDGET_TYPES` still lists `metric-card` as the component arm's `type`.
