---
---

Comment-only correction in `@object-ui/types`; releases nothing (objectui#10905).

Two source docblocks still described shapes that objectui#10770 and objectui#7928
changed earlier in this same unreleased batch. The `ObjectChartSchema.series`
docblock said a `type` written on the `{ dataKey }` arm is an excess property on
a literal typed by the interface; since the `{ name }` arm is the spec's
`ChartSeries`, which declares `type`, that literal compiles, and only the zod
mirror still strips the key. The zod route overview headed "WHERE THIS ARM IS
INSTALLED" said a named view's `listViews` is unmirrored and named a `custom`
issue under `options.kanban` there; `listViews` is the protocol's strict record
by reference, which refuses a named view's `options` bag whole, and the named-view
check reports at `listViews.KEY.kanban.groupBy` only.

No behaviour, type, accept set or `.describe()` string moves. The `series`
sentence is emitted into the published `.d.ts`, but it and the change that made it
false are both unreleased, so no release ever carried the false text.
