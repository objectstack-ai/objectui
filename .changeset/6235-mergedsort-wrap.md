---
'@object-ui/plugin-view': patch
---

At this change `ObjectView` wrapped `table.defaultSort` before handing it to a delegated
list view, so a view whose only ordering was the deprecated key actually sorted
(objectui#6235).

⚠️ **Dated note, 2026-09-25 — this wrap has since been retired — objectui#5861.** Later in
this same release `table.defaultSort` became an ADR-0049 retirement tombstone and
`mergedSort` lost the branch this entry changed: it now ends at `table.sort`, so a
`table.defaultSort` alone hands the delegated slot no sort at all and the view renders
unsorted. The rest of this entry is kept as the reading of this change; the objectui#5861
entry states what ships and the migration (`sort: [{ field, order }]`).

`ObjectGridSchema.defaultSort` is declared a SINGLE `{ field, order }` object — the zod
mirror agrees (`z.object({ field, order })`, not a union) — while the `list-view` node's
`sort` slot is declared `string | SortConfig[]`, imported by reference from the spec's own
`ListViewSchema`. `mergedSort`'s last branch forwarded the bare object into that slot
unwrapped. The three branches ahead of it all produce an array or a string, so this was the
one shape the slot never declared.

Nothing crashed and nothing warned: every reader of that slot drops an unparseable sort
silently. `ListView.parseSortConfig` and `ObjectGrid.parseSchemaSort` both open
`typeof sort === 'string' ? [sort] : Array.isArray(sort) ? sort : []`, so a bare object
yields `[]`; the shared sink `convertSortToQueryParams` returns `undefined` for it. Both
in-tree hosts feed the slot straight into `ListView` (`app-shell`'s `fullSchema` and
Studio's `renderStudioGridList`), so the symptom was an unsorted list with no error —
while the SAME metadata sorted correctly as a grid, because `ObjectGrid` performs this
lowering for the same pair.

The wrap was verbatim the one the non-grid fetch path in this same file then applied
(`|| (schema.table?.defaultSort ? [schema.table.defaultSort] : undefined)`), so at this
change all three consumers agreed and no fourth dialect was introduced. The shared sink is deliberately
NOT widened to accept a bare `{ field, order }`: that is the widening the maintainer ruling
of 2026-08-22 rejected on the merits, because the same slot legitimately carries
`$orderby`'s own `Record<field, direction>` map, in which `{ field: 'desc' }` is a legal
ordering by a column literally named `field`.

Precedence was unchanged — a named view's sort still outranked `table.sort`, which still
outranked `table.defaultSort`. Only the final branch changed shape.

One behaviour note for hosts writing off-schema metadata: an ARRAY in `table.defaultSort`
was previously forwarded verbatim by this path alone and is now lowered like every other
resolver in the repo, which leaves it unreadable rather than rescuing it. That input is
already refused by the zod mirror and already behaves this way on the fetch path and in
`ObjectGrid`; the canonical slot for an array is `table.sort`.
