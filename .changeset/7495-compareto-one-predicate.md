---
'@object-ui/core': minor
'@object-ui/plugin-dashboard': minor
---

One declaration of which chart families ignore `compareTo` (objectui#7495).

**New in `@object-ui/core`:** `chartTypeIgnoresCompareTo(chartType)`, exported from
`chart-presentation`. It answers `true` for `pie`, `donut`, `funnel` and `scatter` and
`false` for every other chart family, an unknown string, and `undefined` — the answers
`@object-ui/plugin-charts`' ObjectChart already gave through its own local predicate.
ObjectChart now reads the core predicate instead of keeping that list, so the inline chart
path behaves exactly as before.

**Behaviour change in `@object-ui/plugin-dashboard`:** a dataset chart widget whose chart
family ignores `compareTo` no longer asks the executor for a comparison. That covers the
widget types `pie`, `donut`, `funnel`, `pyramid` (renders as a funnel), `scatter` and
`bubble` (renders as a scatter). The dashboard used to carry its own, narrower copy of the
list (scatter only), and it gated only the overlay series, never the query: every one of
these widgets still forwarded `compareTo`, still had its date window lowered into
`timeDimensions`, and so made the executor run the comparison pass and attach
`MEASURE__compare` columns. A pie, donut or funnel then appended an overlay series the
renderer dropped; a scatter discarded the columns. Those widgets now send the same selection as the same
widget without `compareTo`: one pass on the server instead of two, and nothing on screen
changes for a widget whose filter carries one bounded date window. One case does change on
screen, for the better: the dataset executor refuses a `compareTo` it has no single dated
window to shift, and the widget showed that refusal in place of the chart — a compare-to
pie, donut, funnel or scatter widget with no dated window now draws its chart, since no
comparison is asked for.

Unchanged: line / area / bar / horizontal-bar / combo chart widgets keep their comparison
overlay, and metric, gauge, table and pivot widgets keep their comparison. The gate is the
chart branch, not the widget type, so a `pie` widget with no dimensions — which renders as
a metric tile and shows the comparison as a delta — keeps it too.

Reachability at the time of the change: `compareTo` appears in no example app metadata in
this repository; incidence in deployed tenant metadata is not measurable from here.
