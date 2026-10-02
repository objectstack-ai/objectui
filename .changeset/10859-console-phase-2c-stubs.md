---
'@object-ui/console': minor
---

chore(console)!: drop the lazy `pie-chart`, `donut-chart` and `radar-chart` stubs (objectui#10859, batch 8 phase 2c)

**BREAKING (authoring):** the console no longer registers lazy stubs for `pie-chart`, `donut-chart` or `radar-chart` in `register-plugins.ts`, nor for `pie-chart` in the dev-only preview gallery. `@object-ui/plugin-charts` retired those keys. `chart`, `object-chart`, `bar-chart` and `chart:bar` stay lazily registered.

Migration:

- `pie-chart` / `donut-chart` / `radar-chart` → `{ "type": "chart", "chartType": "pie" | "donut" | "radar" }`.

**Clause-②: yes**, released as `minor` with this banner.
