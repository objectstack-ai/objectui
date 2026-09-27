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

`ObjectViewSchema`'s named-view door, which already refused the two retired
calendar spellings (objectui#8355), now also refuses `groupBy` in a named view's
`kanban` block and in its legacy `options.kanban` bag. The issue is `custom` at
`listViews.KEY.kanban.groupBy` or `listViews.KEY.options.kanban.groupBy`, and its
message is the same string the `list-view` route gives: "Unrecognized key(s) on
this kanban configuration: `groupBy`. Did you mean `groupBy` → `groupByField`?",
followed by the same explanation. Write `groupByField` (or the deprecated
`groupField`).

The protocol agrees on this route too. On the pinned `@objectstack/spec` 17.4.0,
`ViewSchema` refuses `listViews.KEY.kanban.groupBy` as an unrecognized key
exactly as `ListViewSchema` refuses `kanban.groupBy`, with a dark control
(`groupByField` and `columns` alone) accepted on both. The spec refuses a named
view's `options` bag outright, as it does a `list-view`'s, so refusing
`options.kanban.groupBy` here is no stricter than the protocol.

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
