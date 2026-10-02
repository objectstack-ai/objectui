---
'@object-ui/plugin-dashboard': minor
---

refactor(plugin-dashboard)!: retire the `dashboard-grid` node type key, and register the `metric` / `metric-card` node keys without a bare fallback (objectui#10859, batch 8 phase 2b)

**BREAKING (authoring):**

- **`dashboard-grid` is unregistered** (with `plugin-dashboard:dashboard-grid`). It was builder chrome published as a node key: `objectui validate` refused it at `type`, and nothing authored or emitted it. `DashboardGridLayout` stays a named export; mount it directly.
- **`metric` and `metric-card` register with `skipFallback: true`.** Both dashboard surfaces (`DashboardRenderer`, `DashboardGridLayout`) now hand `SchemaRenderer` `plugin-dashboard:metric` / `plugin-dashboard:metric-card` through one table, `DASHBOARD_NODE_TYPES` in `widgetDispatch.ts`. That covers the static metric tile, the `metric-card` widget-slot entry and a `metric` / `metric-card` node in a widget's legacy `component` envelope. The dashboard WIDGET vocabulary is unchanged: `widgets[].type: 'metric'` and the 2026-08-14 `metric-card` slot entry author exactly as before.
- **`dashboardComponents`** drops `dashboard-grid`, and its `metric` / `metric-card` entries are keyed `plugin-dashboard:metric` / `plugin-dashboard:metric-card`, the type each now serves, so iterating the map cannot re-create the retired bare keys.
- A rendered KPI tile's `data-obj-type` reads `plugin-dashboard:metric` (or `plugin-dashboard:metric-card`) instead of the bare spelling.

Migration:

- `{ "type": "dashboard-grid", "widgets": [ … ] }` → `{ "type": "dashboard", "widgets": [ … ] }`, or mount `DashboardGridLayout` directly for the drag/resize editor.
- a standalone `{ "type": "metric", … }` node → `{ "type": "plugin-dashboard:metric", … }`; inside a dashboard, keep authoring the `metric` widget.
- a standalone `{ "type": "metric-card", … }` node → put it in a dashboard's `widgets[]` (the slot entry), or write `plugin-dashboard:metric-card`.
- `dashboardComponents['metric']` / `dashboardComponents['metric-card']` → `dashboardComponents['plugin-dashboard:metric']` / `dashboardComponents['plugin-dashboard:metric-card']`; `dashboardComponents['dashboard-grid']` → import `DashboardGridLayout`.
- a selector `[data-obj-type="metric"]` / `[data-obj-type="metric-card"]` → `[data-obj-type="plugin-dashboard:metric"]` / `[data-obj-type="plugin-dashboard:metric-card"]`.

**Clause-②: yes** — registrations leave the runtime (narrowing), released as `minor` with this banner.
