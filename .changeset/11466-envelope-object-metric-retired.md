---
'@object-ui/plugin-dashboard': minor
---

**An `object-metric` node in a dashboard widget's legacy `component` envelope now draws the retired-format prompt instead of its number (objectui#11466).** This follows the maintainer's ruling A on objectui#11466, which extends ruling C on objectui#11525 (a dashboard metric takes its number only through a `dataset`) to this last inline metric form.

**What changes on screen.** The change covers a stored widget written in objectui's legacy envelope format, `{ id, component: { type: 'object-metric', objectName, aggregate, … }, layout }`, which the spec's widget has no member for:

- **Before:** `DashboardRenderer` and `DashboardGridLayout` drew the aggregated number in the tile, and on `DashboardRenderer` the dashboard filter bar's value was merged into the node as a flat `filter`.
- **Now:** both surfaces draw "This widget uses a retired data format. Edit it to bind a dataset." and send no query. The same holds when the node is written under its registration's full name, `plugin-dashboard:object-metric`. The filter bar's broadcast no longer covers `object-metric`.

Breaking for stored dashboards that still carry this form; `minor` because objectui never declares `major`. No producer of the form was measured in objectui or objectstack outside the pin that covered it (the measurement is on objectui#11466); stored customer dashboards are unmeasured, the gap ruling C accepted.

**The fix.** Replace the envelope with a dashboard widget bound to a dataset: set `dataset` and select its `values` by name, as for any metric widget. A dataset-bound metric draws its number.

**What does not move:**

- Every other node in a `component` envelope draws as before, and the filter bar still scopes an envelope's `object-chart` and `object-data-table`.
- An `object-metric` block authored on a page (`{ type: 'object-metric', properties: { … } }`) draws as before.
- The zod and TypeScript authoring faces are unchanged.
