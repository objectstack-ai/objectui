---
'@object-ui/plugin-list': minor
'@object-ui/app-shell': minor
'@object-ui/plugin-view': minor
'@object-ui/plugin-charts': patch
'@object-ui/types': patch
---

feat(plugin-list)!: a chart list view binds only an ADR-0021 `dataset`; the legacy inline chart axes and their `name` / `value` floors are retired on every route (objectui#6152, round 15)

Clause-②: no

**Changed (breaking for a stored chart view that names no `dataset`).** Every door refuses the
pre-ADR-0021 chart axes on a list view: `@objectstack/spec`'s chart block is a strict object of
`chartType`, `dataset`, `dimensions` and `values`, and `@object-ui/types`, `objectui validate` and the
platform's view write door judge by it, top-level and in the `options` bag. The renderers kept
reading the axes, so a chart view stored before the doors closed still drew an inline aggregate, and
a chart view that declared nothing was drawn from the invented fields `name` and `value`. They no
longer do, on every route that did: `ListView`'s chart branch and its capability gate, the object
page's chart view (`@object-ui/app-shell`) and `ObjectView`'s own views (`@object-ui/plugin-view`).

| stored chart block (either nesting) | what renders now | write instead |
| :--- | :--- | :--- |
| `xAxisField` / `categoryField`, `yAxisFields` / `valueField`, `aggregation` (and, on the object page, `series` and `filter` on the block) | the chart's refusal: "Chart category axis required", in place of the chart; a view of another type no longer offers Chart in its view switcher | `chart: { dataset, values, dimensions }`, naming an ADR-0021 dataset of the object |
| no binding at all on a view whose `viewType` is `chart` | the same refusal, where a chart grouped by `name` and counting `value` used to draw | the same dataset block |

A dataset-bound chart renders as before. The refusal is `ObjectChart`'s own screen for an object-bound
chart that names no category axis (objectui#8168); its remedy names that component's keys, not the
list view's dataset block.

**Not measured: production.** The census before this change (objectui#6152 round 13) found no writer
and no stored row carrying these axes in any repository corpus a seat can reach, with positive
controls; this repository's create-view dialog writes the dataset block. Stored view and page
metadata in deployments was not measured. A row that carries the axes renders the refusal until it is
re-saved with a dataset block.

- `@object-ui/plugin-view`: an `ObjectView` kanban view no longer reads `kanban.conditionalFormatting`.
  The list view's kanban block does not declare it, and every door that judges the block refuses it
  by name; the view's own `conditionalFormatting` is the one place it is read. The development-only
  flat-key warning no longer names `dateField`, `groupBy`, `groupField`, `imageField` or
  `subtitleField`, which it told an author to move into a block that refuses them.
- `@object-ui/app-shell`: the object page's development-only flat-key warning no longer names the
  twelve keys every per-kind block refuses (among them `groupField`, `imageField`, `cardFields`,
  `xAxisField`, `yAxisFields`, `aggregation` and `series`).
- `@object-ui/plugin-charts`, `@object-ui/types`: comments only, where they said the list-view relays
  still read the legacy axes.
