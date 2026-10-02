---
'@object-ui/plugin-charts': minor
---

refactor(plugin-charts)!: retire the `scatter-chart` node type key; scatter is `chart` + `chartType: 'scatter'` (objectui#10859, batch 8 phase 2b)

**BREAKING (authoring):** the plugin no longer registers `scatter-chart` (and with it `plugin-charts:scatter-chart`), a second key on the generic `ChartRenderer` whose family came from its `CHART_TYPE_KEYWORD_FAMILIES` row. That row is gone too. `objectui validate` refused a `scatter-chart` node at `type`, and nothing in this repository, its examples or objectstack authored it. A node authored `type: "scatter-chart"` now renders the "Unknown component type" panel.

Migration:

- `{ "type": "scatter-chart", … }` → `{ "type": "chart", "chartType": "scatter", … }`, with the same keys.

A legacy report section whose `chart.type` says `scatter-chart` now reaches the generic `chart` renderer with no family derived from that type; give it `chartType: "scatter"`.

`pie-chart`, `donut-chart` and `radar-chart` were ruled the same way but stay registered: this package's `examples/chart-examples.ts` still authors them, so they wait on their own decision.

**Clause-②: yes** — a registration leaves the runtime (narrowing), released as `minor` with this banner.
