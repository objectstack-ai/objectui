---
"@object-ui/types": minor
---

**A named view's stray `kanban.groupBy` on an `object-view` document is now refused by name, with the message the `list-view` route already gives.**

The objectui#8365 ruling (option B, maintainer 「8365 同意」) refuses a stored
view's `kanban.groupBy` loudly, at the read door of the view, pointing at
`groupByField`. PR objectui#9236 installed that refusal on the `list-view` route
only. A named view is the second route: `ObjectViewSchema.listViews` is
unmirrored, so nothing `ListViewSchema` declares reaches it, and
`safeValidateSchema` accepted `listViews.KEY.kanban.groupBy` green in either
nesting and kept the key.

`ObjectViewSchema` gains a second named-view check on the same door, beside the
one that refuses the two retired calendar spellings (objectui#8355). It refuses
`groupBy` in a named view's `kanban` block and in its legacy `options.kanban`
bag. The issue is `custom` at `listViews.KEY.kanban.groupBy` or
`listViews.KEY.options.kanban.groupBy`, and its message is the same string the
`list-view` route gives: "Unrecognized key(s) on this kanban configuration:
`groupBy`. Did you mean `groupBy` → `groupByField`?", followed by the same
explanation. Write `groupByField` (or the deprecated `groupField`).

⚠️ **Dated note, 2026-09-28 — `listViews` has since been mirrored, and the
`options.kanban` bag is refused whole — objectui#7928.** Later in this same release
`ObjectViewSchema.listViews` became the protocol's strict `ObjectListViewSchema` record,
by reference, so "`ObjectViewSchema.listViews` is unmirrored" above no longer holds. The
protocol now refuses `listViews.KEY.kanban.groupBy` itself (`unrecognized_keys` at
`listViews.KEY.kanban`), and this check still adds its `custom` issue at
`listViews.KEY.kanban.groupBy`, with the same message. It no longer judges the legacy
bag: the record refuses a named view's `options` whole (`unrecognized_keys` at
`listViews.KEY`, naming `options`), so nothing reports
`listViews.KEY.options.kanban.groupBy`. `.changeset/7928-listviews-by-reference-fold.md`
(PR objectui#10821) states what ships; the text above is kept as the reading of this change.

The protocol agrees on this route too. Measured on `@objectstack/spec` 17.4.0
when this change was made, `ViewSchema` refuses `listViews.KEY.kanban.groupBy`
as an unrecognized key exactly as `ListViewSchema` refuses `kanban.groupBy`,
with a dark control (`groupByField` and `columns` alone) accepted on both. The
spec refuses a named view's `options` bag outright, as it does a `list-view`'s,
so refusing `options.kanban.groupBy` here is no stricter than the protocol.

**Breaking, in the sense worth stating explicitly** (shipped `minor`: this repo
never declares `major`, and every package sits in one `fixed` group). An
`object-view` document whose named view carries `kanban.groupBy`, in either
nesting, now **fails validation** where it used to pass: any pipeline running
`safeValidateSchema` over it (objectui's own `objectui validate` does) reports
one issue per written key, naming the key and the replacement. What the board
renders does not change here: `generateViewSchema` already drops the key and
resolves the lane from `groupByField` (objectui#9242).

Not changed, deliberately: `listViews` stays unmirrored. The door declares no
value type, puts no key in the shape, requires no `columns`, and refuses neither
an undeclared sibling in the kanban block nor the legacy `options` bag itself;
the value type `listViews` should enforce is objectui#7928's. `groupBy` is not
honoured as an alias (the ruling rules that out), and `groupBy` on the generated
`object-kanban` node, the lane key `ObjectKanban` reads, is untouched.

⚠️ **Dated note, 2026-09-28 — what a written key now reports, and what the record now
refuses — objectui#7928.** Later in this same release the named-view record became the
protocol's own, by reference. A `groupBy` in a named view's `kanban` block now reports
two issues, the protocol's `unrecognized_keys` and this entry's pointer; one in the
`options.kanban` bag reports only the refusal of `options`, which names neither `groupBy`
nor `groupByField`. So "one issue per written key, naming the key and the replacement"
no longer holds. `ObjectViewSchema` now declares the value type the paragraph above
defers to objectui#7928: `listViews` is in its shape, a named view needs `columns`, and
the record refuses an undeclared sibling in the kanban block and the `options` bag. This
entry's check now adds its message to a document the record already refuses.
`.changeset/7928-listviews-by-reference-fold.md` (PR objectui#10821) states what ships;
the text above is kept as the reading of this change.
