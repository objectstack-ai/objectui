---
'@object-ui/plugin-dashboard': patch
---

fix(plugin-dashboard): a dimensionless table renders a row of every measure, and a dimensionless chart one mark per measure

`DatasetWidget` treated every widget that declares no `dimensions` as a
one-number tile. So `{ type: 'table', dataset: 'sales', values: ['revenue', 'cost', 'margin'] }`
rendered `revenue` alone, and `cost` and `margin` were queried and never
shown. Every door accepts that widget, and the spec's metric-family arity
refusal sends authors to it: "`type: 'table'` renders a row of measures, and
the chart families (`bar` / `line` / `area` / `combo`) render one mark per
measure".

Only a metric-family type is now a tile by type. With no dimension and two or
more measures:

- a `table` / `pivot` renders one row carrying every measure, with no totals
  footer (that one row is the grand total);
- a `bar` / `line` / `area` / `combo` chart plots one mark per measure, with the
  measures' labels on the category axis, under one series labelled with the
  existing `dashboard.total` string. A comparison the widget asks for is drawn
  beside each measure.

Unchanged: a widget with one measure and no dimension is still a tile on every
type, since nothing is dropped. A dimensionless widget of a type the spec's
text does not name (`pie`, `donut`, `funnel`, `scatter`, `column`,
`horizontal-bar`, `radar`, `treemap`, `sankey`) also keeps its tile. The query
still selects exactly the declared measures.
