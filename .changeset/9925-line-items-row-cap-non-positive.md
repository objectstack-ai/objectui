---
'@object-ui/plugin-form': patch
---

Refuse a row cap the contract already refuses before it reaches `$top`, at the
LAST read point in the repo that still forwarded one — `record:line_items`
(objectui#9925).

This panel spelled its row cap as a bare `schema.limit ?? DEFAULT_LINE_ITEMS_LIMIT`.
`??` rejects only `null` and `undefined`, so a value the contract refuses was not
nullish and survived as a real fetch window: it reached the adapter as `$top: 0`,
the panel asked the server for nothing, and the empty line-items grid named no
cause. A negative went out the same way, and a non-integer became a fractional
window.

The read now goes through one resolver, mirroring the shape objectui#9853 landed
on `ObjectGrid`, objectui#9897 repeated on `ListView`, and objectui#9925 landed on
`object-kanban`, `object-timeline` and `record:reference_rail` — one resolver at
every entry is what keeps the answer single. A refused value is dropped, this
panel's own default is used, and one `console.warn` names the block, the child
object and the value. The warning is conditional and deduped: an absent `limit`
and a usable one both stay silent, and one declaration warns once rather than
once per render.

This closes BOTH entrances into the panel, which is why the repair is at the read
point. The panel reads one key, and two authoring shapes fill it: a `dataSource`
binding lowers a named view's `pagination.pageSize` into `schema.limit`, and a
panel with no binding at all carries the authored `limit` straight through. A
repair at the lowering layer would close only the first.

Refusing this is not a renderer choosing a meaning. `@objectstack/spec` declares
the element data source `limit` a binding lowers into this key a positive integer
(`z.number().int().positive().optional()`), and so is the `pagination.pageSize`
of a named view that fills it.

⛔ No fallback literal changed: the panel keeps the `500` it already documented.
⛔ No shared helper was extracted — a shared home would be `@object-ui/core`,
which is objectui#9928's package and out of this card's face.
