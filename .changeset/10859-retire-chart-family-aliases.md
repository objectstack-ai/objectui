---
'@object-ui/plugin-charts': minor
---

refactor(plugin-charts)!: retire the `pie-chart`, `donut-chart` and `radar-chart` node type keys; the families are `chart` + `chartType` (objectui#10859, batch 8 phase 2c)

**BREAKING (authoring):** the plugin no longer registers `pie-chart`, `donut-chart` or `radar-chart` (and with them `plugin-charts:pie-chart`, `plugin-charts:donut-chart` and `plugin-charts:radar-chart`), and their `CHART_TYPE_KEYWORD_FAMILIES` rows are gone. `objectui validate` already refused each at `type`. Their one producer, this package's `examples/chart-examples.ts`, now authors `{ type: 'chart', chartType: … }`, which `objectui validate` accepts on both faces. A node still authored with one of the three types now renders the "Unknown component type" panel.

Migration:

- `{ "type": "pie-chart", … }` → `{ "type": "chart", "chartType": "pie", … }`, with the same keys;
- `{ "type": "donut-chart", … }` → `{ "type": "chart", "chartType": "donut", … }`, with the same keys;
- `{ "type": "radar-chart", … }` → `{ "type": "chart", "chartType": "radar", … }`, with the same keys.

A legacy report section whose `chart.type` says one of the three now reaches the generic `chart` renderer with no family derived from that type; give it the matching `chartType`. `chart:bar` is the one family keyword this package still registers.

**Clause-②: yes** — registrations leave the runtime (narrowing), released as `minor` with this banner.
