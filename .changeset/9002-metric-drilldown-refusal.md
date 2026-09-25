---
'@object-ui/types': patch
'@object-ui/plugin-dashboard': patch
---

`object-metric` refuses `drillDown.filter` and `drillDown.mode` on its prop type (objectui#9002)

Refused at the TypeScript door only. A stored JSON metric config carrying either key is
still accepted and ignored at render, as it was before: no runtime validator in this
repository reads the members of an `object-metric` `drillDown`.

Neither key ever had a read site on a metric. A metric is one aggregated number, so it has
no clicked point for a drill `filter` to interpolate `${event.*}` against, and no row for
`mode` to open as a record. Its drilled list is always scoped by the block's own `filter`,
which is the registration's promise that the number and the records behind it agree. Both
keys still type-checked on the widget's `drillDown` prop and then did nothing, with no
diagnostic.

- `@object-ui/types` adds `ObjectMetricDrillDownConfig`, published on the root entry
  `@object-ui/types` and on the `@object-ui/types/data-display` subpath: `DrillDownConfig`
  with `filter?: never` and
  `mode?: never` tombstones whose docblocks name the blocks that do read each key
  (`object-chart` and `object-pivot` for `filter`, `object-data-table` for `mode`). The
  shared `DrillDownConfig` is unchanged and keeps both keys for those blocks.
- `@object-ui/plugin-dashboard` types `ObjectMetricWidget`'s `drillDown` prop with it, and the
  `object-metric` registration's `drillDown` description now says in one sentence that the
  two keys do not apply to a metric and where they do.

TSX code that passes `filter` or `mode` inside `ObjectMetricWidget`'s `drillDown` now fails
to compile. Delete the key: the drilled list was already scoped by the metric's own
`filter`, and nothing read `mode`. Runtime behaviour is unchanged.
