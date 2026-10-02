---
'@object-ui/plugin-dashboard': patch
---

The drill-down drawer renders a `drillDown.report` as a `report` node, `{ type: 'report', report }` (objectui#11440).

It used to render a `spec-report` node, the alias `@object-ui/plugin-report` retires in this same release. The drilled report still carries the widget's resolved filter in its `filter` member, joined to the report's own `filter` with `$and` when it has one; a dataset-bound report does not apply that member (objectui#5137), which this release does not change (objectui#11506). What the drawer draws is unchanged, provided `@object-ui/plugin-report` is at this release too: an older `ReportRenderer` unwraps the `report` member only on `spec-report`. Nothing authored changes. The README's `object-pivot` row no longer calls the block an internal wrapper: it is a public block whose props go in `properties`.
