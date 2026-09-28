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

No behaviour, type, accept set or `.describe()` string moves. Both docblocks reach
the build output only as comment text (the `series` one in the emitted `.d.ts`,
the route overview in the zod module's JavaScript), so there is nothing for a
consumer to act on.
