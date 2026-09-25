---
'@object-ui/types': minor
'@object-ui/plugin-list': minor
---

A `chart` list view bound to a semantic `dataset` takes its scope from the dataset:
a view filter on it is now refused at authoring, and its toolbar no longer offers
filter controls (objectui#10327).

The dataset shape of the list view's chart builds a node with no filter: the chart
queries the dataset through `queryDataset` with its dimensions and measures, and a
dataset's fields need not be the list object's. So a view filter written on such a
view was accepted and silently dropped, and the chart drew unfiltered totals that
read as filtered ones. The toolbar Filter builder and the filter chips reached only
the list's own fetch of the object's rows, never the chart.

**New refusal (`@object-ui/types`).** `ListViewSchema` refuses `filter` — and the
legacy `filters` alias — on a view with `viewType: 'chart'` whose chart block (`chart`,
or the legacy `options.chart` bag when no `chart` is declared) names a `dataset`. The
issue is a `custom` one at the written key, and its message ends with the remedy: a
dataset chart's scope is written in the dataset. An empty filter array, a chart bound
to the list object, and a view of another kind that only offers a switch to a dataset
chart are all still accepted.

**Toolbar (`@object-ui/plugin-list`).** While a dataset-bound chart is on screen, the
Filter builder and the `userFilters` chips are not rendered. A chart bound to the list
object keeps both, because its node carries the effective filter.

What an author sees change: a dataset chart view that declared a `filter` now fails
validation with the remedy above instead of drawing unfiltered numbers. Put the scope
in the dataset. No example, app or doc in this repository declared such a view; the
search is on the pull request.
