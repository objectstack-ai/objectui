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

⚠️ **Dated note, 2026-09-28 — `series` has since become two arms — objectui#10770.** Later
in this same release each `ObjectChartSchema.series` entry became ONE of two arms, on
both faces: the spec's `ChartSeriesSchema` (`{ name }`, by reference, the AUTHOR arm) or
the internal `{ dataKey }` arm. The `.describe()` and the docblock now describe both. So
"the copy is that `{ dataKey }` arm minus its per-series `type`" holds for the internal
arm only, and `chartType` is the per-series family override on that arm only: on a
`{ name }` entry the override is the spec's `type`, which an `object-chart` node now
accepts. The deliberate omission of `type` stands on the `{ dataKey }` arm, where the
zod mirror still strips it. `.changeset/10770-object-chart-react-tier-node.md` (PR
objectui#10802) states what ships; the text above is kept as the reading of this change.

Wording only. The accepted shape does not move on either face: the element
type, its members and the mirror's parse result are what they were.
