---
'@object-ui/types': minor
---

feat(types): a node bound through `dataSource.object` needs no `objectName` on the validator (objectui#11117)

`safeValidateSchema` (and `objectui validate`, which runs it) refused every per-element binding
the docs teach — `{ "type": "object-grid", "dataSource": { "object": "product", "limit": 20 } }`,
the same on `list-view`, and `object-kanban`'s documented board — although each of those blocks
renders it: their registrations are wrapped in `ElementDataSourceGate`, which lands the
binding's `object` on `objectName` before the renderer reads the node, and `@objectstack/spec`
accepts the node as written. `object-grid` and `list-view` required `objectName`, and the
record-source rule of `object-kanban`, `object-calendar`, `object-gantt` and `object-map` had no
rung for the binding.

**A widening.** On those six blocks a node whose `dataSource.object` is a non-empty name now
validates with no `objectName` and no other record source. Nothing that validated before is
refused:

- `objectName` alone still validates, an empty one included.
- A node with neither is still refused, now at the node's root with
  `params.code = 'RECORD_SOURCE_REQUIRED'` on `object-grid` and `list-view` too (it was an
  `invalid_type` at `objectName` there). Its message names `dataSource.object` beside the keys the
  block reads.
- `dataSource: { object: '' }` supplies nothing, as at runtime, so that node is still refused.
- A wrong-typed `objectName` beside a binding is still refused at `objectName`.

One refinement carries the rule for all six blocks. It counts the binding with the same predicate
`element:number`'s spec waiver uses, so the validator, the spec's props gate and the runtime agree
on what a binding is.

The TypeScript `ObjectGridSchema` keeps `objectName: string`: it is the type `ObjectGrid` reads
after the gate has run. `ListViewSchema` is derived from its validator, so its `objectName` is
now optional.

Docs: in `content/docs/utilities/data-objectstack.mdx`, the "Narrowing a saved view" example
writes its `filter` as the rule array `[{ field, operator, value }]` the spec takes, and the
`ElementDataSource` excerpt types `filter` as `ViewFilterRule[]`. The data-binding guide and the
schema reference say that a bound node needs no `objectName`.
