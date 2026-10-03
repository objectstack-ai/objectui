---
'@object-ui/plugin-charts': minor
---

fix(plugin-charts): an `object-chart` whose `specType` is a single-value or tabular spec family draws its routed form, not a silent bar chart; the renderer has no default family (objectui#11520)

**What an accepted document draws changes.** `specType` is the react tier's chart family: the react-page wrapper parks `<ObjectChart type="gauge">` there, because `type` is the node's discriminator. Both faces declare it as the spec's whole `ChartTypeSchema`, so an `object-chart` with `specType` set to `gauge`, `solid-gauge`, `metric`, `kpi`, `bullet`, `table` or `pivot` parsed on both faces, and drew a **bar chart**, with no note. The same families on `chartType` already drew the forms below.

- **`gauge`, `solid-gauge`, `metric`, `kpi`, `bullet` on `specType`** now draw the number card: one row's number, the form the same family draws on `chartType`.
- **`table`, `pivot` on `specType`** now draw the tabular notice, which names the data-table and pivot components.
- **An off-spec `specType`** (both faces refuse it) draws the unknown-type notice, which names the value.
- **A chart that names no family at all** (both faces refuse it: `object-chart` needs `chartType` or `specType`, and `chart` needs `chartType`) draws a notice reading "This chart names no chart type — nothing was drawn." It used to draw a bar chart. A caller that means a bar names `bar`.

Every family this block draws as a chart draws exactly what it drew before, on both keys.

How: `normalizeChartSchema` used to keep only the families this package draws as a chart, and `AdvancedChartImpl` drew a missing family as `'bar'`. The normalizer now hands the named family on as named, so `specType` reaches the same family dispatch `chartType` reaches, and the `'bar'` default is removed (with its four copies in the refusal guards).

⚠️ **Type.** `NormalizedChartSchema['chartType']`, exported from this package, widens from the thirteen drawn families to the declared chart families (`DeclaredChartFamily` in the emitted declarations; not a new entry export): `object-chart`'s `chartType` union together with its `specType` (the spec's `ChartType`), both read off `ObjectChartSchema` in `@object-ui/types` by reference. It is now the family the schema names, drawn or not, and a misspelled family still fails to compile. Shipped as `minor`, not `major` (objectui never declares `major`); a consumer that reads it exhaustively needs a branch for each single-value and tabular family, which this package draws no chart of.
