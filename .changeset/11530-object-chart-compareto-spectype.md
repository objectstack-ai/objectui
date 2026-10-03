---
'@object-ui/plugin-charts': patch
---

fix(plugin-charts): an `object-chart` whose family is on `specType` gets `compareTo` exactly as the same family on `chartType` does, so a `specType: scatter` chart with `compareTo` draws instead of refusing, and `specType: pie` makes no comparison fetch (objectui#11530)

`ObjectChart` decides two things with `chartTypeIgnoresCompareTo` from `@object-ui/core`: whether to run the comparison query, and whether to add the `__comparison` overlay series. Both read only `chartType`. A family on `specType` (the react tier's channel, which objectui#11520 routes) was invisible to them. So a family that ignores `compareTo` (`pie`, `donut`, `funnel` and `scatter` at this release) still fetched the comparison window and still got the overlay:

- **`specType: scatter` with `compareTo`** made 2 aggregate calls and rendered the refusal "A scatter plots one measure. Keep exactly one series: amount, amount__comparison" (with the document's own measure). It now makes 1 call and draws the scatter.
- **`specType: pie`, `donut` or `funnel` with `compareTo`** made a comparison call whose rows the chart never drew. It now makes 1 call. The picture is unchanged.

Both decisions now read the family the chart draws, which is the value `normalizeChartSchema` hands `ChartRenderer`: `chartType`, else `specType`. The family list stays the one in `chartTypeIgnoresCompareTo`. The object fetch also re-runs when that family changes, where it used to re-run on a `chartType` change only.

No other document changes: a family on `chartType` and every family that keeps `compareTo` (on either key) fetch and draw as before.
