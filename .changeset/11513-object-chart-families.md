---
'@object-ui/types': minor
---

feat(types): `ObjectChartSchema.chartType` declares the `@objectstack/spec` chart families plugin-charts draws (objectui#11513)

**Clause-②: yes (widening)** — the accept set only widens. Every document that parsed still parses.

`chartType` on an `object-chart` node declared eight families on both faces: `bar`, `column`, `horizontal-bar`, `line`, `area`, `pie`, `donut` and `scatter`. The installed spec's `ChartTypeSchema` (17.5.0) declares twenty, and plugin-charts draws thirteen of them as a chart. The dashboard renderers compose an `object-chart` node with every series family they route, so the node they build named families the face refused.

It now declares those thirteen. Five families are new: `funnel`, `treemap`, `sankey`, `combo` and `radar`.

- **Zod (`@object-ui/types/zod`).** `ObjectChartSchema.chartType` is picked out of the spec's `ChartTypeSchema` by reference (`.extract`). The authored `object-chart` bag (`ObjectChartBlockSchema`, `properties.chartType`) reads the same member, so it widens too. A family the spec drops fails when the module loads.
- **TypeScript.** `ObjectChartSchema['chartType']` is the same thirteen, `Extract`ed from the spec's `ChartType`.
- **Still refused.** The spec's single-value families (`gauge`, `solid-gauge`, `metric`, `kpi`, `bullet`) and tabular ones (`table`, `pivot`) draw no chart on this block. A single-value family renders one row's number, and a tabular one renders a notice. They are refused at `chartType` (`properties.chartType` on an authored node), and the message names the declared set. Write a single number as an `object-metric`, rows as an `object-data-table`, a cross-tab as an `object-pivot`.

```json
{ "type": "object-chart", "properties": { "chartType": "funnel", "objectName": "opportunity", "aggregate": { "field": "amount", "function": "sum", "groupBy": "stage" }, "xAxis": { "field": "stage" }, "series": [{ "name": "amount" }] } }
```

Nothing changes at render time: plugin-charts already drew all thirteen. `specType`, the react tier's family key, is unchanged. It is still the spec's whole `ChartTypeSchema`, by reference.

⚠️ Shipped as `minor`, not `major` (objectui never declares `major`). The TypeScript union widens, so a consumer that reads it exhaustively can stop compiling: a `switch` with an exhaustiveness check, or a `Record` keyed by `NonNullable<ObjectChartSchema['chartType']>`, now needs entries for the five new families.
