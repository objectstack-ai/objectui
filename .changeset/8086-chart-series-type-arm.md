---
'@object-ui/plugin-charts': minor
---

`ChartRendererProps.schema.series`: the `dataKey` arm now declares `type?: string`, the
per-series family override the `name` arm already declares, with the same member type
(objectui#8086). The TypeScript face now states what `ChartDataSeriesSchema` (where
`dataKey` and `name` are each independently optional beside `type`) and the renderer
(every entry goes through `normalizeSeries`, objectui#7681) accept. No other arm changes:
`chartType` stays on the `dataKey` arm alone, and wins when an entry writes both.

The accept set only widens. A value typed as the `dataKey` arm may now carry `type`, and
an entry narrowed with `'dataKey' in entry` may read it; nothing that compiled before is
refused. `ChartRendererProps` is not re-exported by name from the package entry: it
reaches consumers as the props type of the exported `ChartRenderer` component. An object
literal written against the whole `series` union was already accepted before this
change, because `type` is known to the `name` arm; the gap was at the arm.

The `ObjectChartSchema.series` docblock in `@object-ui/types` is restated to match: that
copy of the internal arm does not carry `type`, and its type is unchanged.
