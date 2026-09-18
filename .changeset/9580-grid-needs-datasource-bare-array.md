---
'@object-ui/plugin-grid': patch
---

`object-grid`'s no-data-source gate stops reading a bare `data` array as "this placement needs no
adapter" (objectui#9580).

`gridNeedsDataSource` enumerates the escape hatches that let a grid draw rows without a runtime
adapter, and `Array.isArray(schema.data)` was one of them. Two rulings had already retired that
carrier on both of its sides: objectui#8348 (「8348 以协议为准」, decision batch #83) at the shared
record-source ladder, because this block's published `data` row is the `ViewData` OBJECT arm, and
objectui#9571 (ruling objectui#8348 Q2-C, batch #136 item 3, maintainer 「同意」) at the props
channel, so `SchemaRenderer` no longer spreads an authored `data` as a React prop for a block on
that arm.

The two together left the gate describing a carrier that no longer exists. A grid authored with a
bare `data` array, an `objectName` and no adapter drew **nothing** — and the one diagnostic that
exists to explain exactly that, the objectui#5378 item 2 "no data source" panel, stayed silent
because the predicate still counted the array as a row source. The author got the empty shell that
panel was built to replace. objectui#9571's warn-once is `__DEV__`-only; this gate is the
production-facing half.

⛔ What did NOT change: the bare-array carrier itself stays retired — that was ruled twice and is
not re-opened here. Every other escape hatch is untouched and pinned as a control — the declared
`data: { provider: 'value', items: [...] }` form, the deprecated `staticData` array, the data-scope
`bind`, the `data` REACT PROP a host such as `plugin-list`'s `ListView` uses to hand down rows it
already fetched, and the `objectName` clause that keeps a grid naming no object pointed at its own
defect instead of at this one.

User-visible effect: such a grid now renders the "No data source resolved" panel, naming the block
and the object it was about to read, instead of a header-only table that is indistinguishable from
a query that matched no rows.
