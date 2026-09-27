---
'@object-ui/types': patch
---

docs(types): the `ObjectChartSchema.series` description says the copy omits the per-series `type`, and names `chartType` as its override

The zod mirror's `.describe()` on `ObjectChartSchema.series` called the element
"the arm ChartRendererProps declares". Since objectui#8086 that arm also carries
a per-series `type`, which this copy does not declare, so the sentence was no
longer true member for member. It now says the copy is that `{ dataKey }` arm
minus its per-series `type`, and that the per-series family override on an
`object-chart` node is `chartType` (`bar` | `line` | `area`).

The TypeScript docblock on the same member now says the omission is deliberate
rather than a lag: taking `type` up would widen a published accept set, and
that waits for a named producer that writes it on an `object-chart` node.

Wording only. The accepted shape does not move on either face: the element
type, its members and the mirror's parse result are what they were.
