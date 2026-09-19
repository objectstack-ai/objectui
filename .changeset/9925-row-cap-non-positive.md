---
'@object-ui/plugin-kanban': patch
'@object-ui/plugin-timeline': patch
'@object-ui/plugin-detail': patch
---

Refuse a row cap the contract already refuses before it reaches `$top`, at the
three read points that still forwarded one — `object-kanban`, `object-timeline`
and each `record:reference_rail` entry (objectui#9925).

Each of these blocks spelled its row cap as a bare `?? DEFAULT`. `??` rejects
only `null` and `undefined`, so a value the contract refuses was not nullish and
survived as a real fetch window: it reached the adapter as `$top: 0`, the block
asked the server for nothing, and the empty board / empty rail / empty card
named no cause. A negative went out the same way, and a non-integer became a
fractional window.

All three now go through one resolver per site, mirroring the shape objectui#9853
landed on `ObjectGrid` and objectui#9897 repeated on `ListView` — one resolver at
every entry is what keeps the answer single. A refused value is dropped, the
site's own default is used, and one `console.warn` names the block, the object
and the value. The warning is conditional and deduped: an absent `limit` and a
usable one both stay silent, and one declaration warns once rather than once per
render.

This closes BOTH entrances into these blocks, which is why the repair is at the
read point. Each block reads one key, and two authoring shapes fill it: a
`dataSource` binding lowers a named view's `pagination.pageSize` into it, and a
block with no binding at all carries the authored `limit` straight through. A
repair at the lowering layer would close only the first.

Refusing these is not a renderer choosing a meaning. `@objectstack/spec` declares
every one of these members a positive integer — `object-kanban`'s `limit`, the
element data source `limit` a binding lowers into `object-timeline`'s, and the
rail entry's own `limit` on `ReferenceRailEntrySchema`.

⛔ No fallback literal changed. Each site keeps the default it already
documented; the rail's was spelled inline twice and is now one named constant so
its two read points cannot drift.
