---
'@object-ui/types': minor
---

`ObjectChartSchema` (and its TS twin) accepts the `object-chart` node that the react tier's `<ObjectChart>` block produces: the spec's `{ name }` series arm, with the chart family carried as `specType` (objectui#10770, ruling 5617465269 principle 1).

The react tier's `<ObjectChart>` authors `@objectstack/spec`'s `ChartConfigSchema`: its react-blocks entry has
`schemaType: 'object-chart'` and `schema: ChartConfigSchema`, and publishes `type` and `series` among its data
props. The objectstack showcase renewals-pipeline page writes
`<ObjectChart objectName="showcase_invoice" type="bar" … series={[{ name: 'total', label: 'Invoice value' }]} />`.
The react-page wrapper spreads those props into an `object-chart` node and parks the author's `type` as `specType`,
because `type` is the node's discriminator. Both faces refused that node: `chartType` was required, and every
series entry needed `dataKey`.

- **`series` is two arms.** An entry is either the spec's `ChartSeriesSchema` (TS: `ChartSeries`), by reference,
  which is the AUTHOR arm, or the unchanged INTERNAL `{ dataKey }` arm the relays compose. The author arm is the
  spec's own closed shape, so an unknown key on it is refused by name, and the spec's `.default()`s are not written
  into the parse output. An entry with neither `name` nor `dataKey` is still refused.
- **`specType` is declared**, as the spec's `ChartTypeSchema` (TS: `ChartType`), by reference.
- **`chartType` is optional.** The zod mirror requires one of `chartType` or `specType`, so a node that names no
  chart family is still refused, at `chartType`. An interface cannot express "one of two", so the TS face does not
  carry that floor.

Measured before the change: no render, publish or `objectui validate` path ran `ObjectChartSchema` on the wrapper's
node, so no user met the refusal. It sat on the contract face: `objectui validate` over a hand-written copy of
that node, and a TS author typing it as `ObjectChartSchema`.

⚠️ Shipped as `minor`. The runtime accept set only widens, but two TS types move in a way that can stop a consumer
compiling:

- `ObjectChartSchema['chartType']` now includes `undefined`.
- An element of `ObjectChartSchema['series']` is a union, so reading `.dataKey` off it needs narrowing first, for
  example `'dataKey' in entry` or `Extract<…, { dataKey: string }>`.
