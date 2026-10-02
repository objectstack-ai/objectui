---
'@object-ui/console': minor
---

chore(console)!: drop the lazy `scatter-chart` and `dashboard-grid` stubs, and stop the `metric` / `metric-card` stubs claiming the bare key (objectui#10859, batch 8 phase 2b)

**BREAKING (authoring):** the console no longer registers lazy stubs for `scatter-chart` (`@object-ui/plugin-charts`) or `dashboard-grid` (`@object-ui/plugin-dashboard`), which those packages retired. The `metric` / `metric-card` stubs, in `register-plugins.ts` and in the dev-only preview gallery, now pass `skipFallback: true`, like the registrations they stand in for, so only `plugin-dashboard:metric` / `plugin-dashboard:metric-card` resolve before the chunk loads.

Migration:

- `scatter-chart` → `{ "type": "chart", "chartType": "scatter" }`;
- `dashboard-grid` → `dashboard`;
- a standalone `metric` / `metric-card` node → `plugin-dashboard:metric` / `plugin-dashboard:metric-card`.

**Clause-②: yes**, released as `minor` with this banner.
