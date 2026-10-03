---
"@object-ui/types": minor
"@object-ui/plugin-designer": patch
"@object-ui/app-shell": patch
---

Close the dashboard widget `type` vocabulary, and admit `metric-card` as objectui's own component extension.

`DashboardWidgetSchema.type` was `string` on the TypeScript interface and `z.string()` in the Zod twin — an unbounded hatch. A typo'd family, a chart type the spec retired, and a component type nothing registers all type-checked and validated, surfacing only as the renderer's red `OBJUI-001` panel at runtime.

It is now the CLOSED `DashboardWidgetTypeName` / `DashboardWidgetTypeSchema`: the spec's own `ChartTypeSchema` families **by reference**, plus two named, closed objectui extension sets — `DASHBOARD_WIDGET_TYPE_EXTENSIONS` (`list`, `custom`: objectui-only widget families) and `DASHBOARD_COMPONENT_WIDGET_TYPES` (`metric-card`: an objectui SDUI **component** type the widget slot holds directly, per the maintainer ruling of 2026-08-14 — objectui's own component enum, explicitly not the spec widget enum).

Three drifts the closure surfaced and this change fixes: the dashboard designer's palette offered `grid`, which is not a widget family in either contract and was refused at publish; the metadata-admin widget inspector and the designer both wrote an unvalidated `string` from their select boxes; and a `@object-ui/types` fixture pinned `bar-chart`, a `plugin-charts` component type, on a dataset-bound widget that could never render as one.

⚠️ **Dated note, 2026-10-02 — `metric-card` is no widget type — objectui#11483.** At this change, `DashboardWidgetTypeName` / `DashboardWidgetTypeSchema` were the spec's families plus two objectui sets, `DASHBOARD_WIDGET_TYPE_EXTENSIONS` and `DASHBOARD_COMPONENT_WIDGET_TYPES`; now they are the spec's families plus `DASHBOARD_WIDGET_TYPE_EXTENSIONS` only. A `metric-card` in the widget slot is read by the slot's component arm alone, which requires its `value`. `DASHBOARD_COMPONENT_WIDGET_TYPES` still lists `metric-card` as that arm's `type`, and `DashboardWidgetSchema['type']` on the TypeScript face still reads it. `.changeset/11483-metric-card-needs-value.md` states what ships. The rest of this entry is kept as the reading of this change.

⚠️ **Dated note, 2026-10-03 — the TypeScript widget arm no longer reads `metric-card` — objectui#11514.** At the 2026-10-02 note above, `DashboardWidgetSchema['type']` on the TypeScript face still read `metric-card`, because that interface was the read type of every `widgets[]` entry. Now it is `DashboardWidgetTypeName` alone: an entry is read by the slot's element type, and only the component arm names `metric-card`. `.changeset/11514-types-widget-arm-type.md` states what ships. The rest of this entry is kept as the reading of this change.
