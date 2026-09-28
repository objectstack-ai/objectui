---
'@object-ui/types': minor
'@object-ui/plugin-view': minor
'@object-ui/app-shell': minor
---

**`ObjectViewSchema.listViews` is the protocol's named-view record, by reference**
(objectui#7928: maintainer ruling A, then the director ruling on `options`).

⚠️ **Breaking for authored metadata** (labelled `minor` under this repo's
version-alignment policy). A named view on an `object-view` node is now judged by
`@objectstack/spec`'s strict `ObjectListViewSchema`:

- the zod mirror declares `listViews` as the spec's own `ViewSchema.shape.listViews`,
  crossed through the import boundary so no protocol default is written into the
  parsed document;
- the TypeScript face is `Record<string, z.input<typeof ObjectListViewSchema>>`.

So a named view needs `columns`, takes `filter` as `{ field, operator, value }`
rules, and puts each view kind's config in the top-level block of that kind
(`kanban`, `calendar`, …). A key the protocol does not declare there is refused
`unrecognized_keys` by name. That includes the objectui#8365 stray
`kanban.groupBy`, which a named view used to accept while a `list-view` document
refused it. The docs have taught this shape since objectui#8255, and `ObjectView`
has honoured it since objectui#8254.

**`options` on a named view is refused, and no longer read.** The legacy per-kind
bag (`options.kanban`, `options.calendar`, …) is not a member of the protocol's
authoring shape. `plugin-view`'s `ObjectView` stopped reading it off a named view.
The host `views` entry keeps its own rung, so nothing changes there. A STORED list
body may still carry the bag, because the protocol declares it on that wire. The
one door that relays a stored body into `listViews`, `app-shell`'s `ViewPreview`,
now folds each `options.KIND` onto the top-level `KIND` block before it builds the
node. Where both spell a key, the top-level value wins, the same per-key merge
`ObjectView` used to apply. A saved view that carried the bag therefore previews
exactly as before. Migrate an authored `options: { kanban: { groupByField } }` to
`kanban: { groupByField, columns }`.

The named-view alias pointers from objectui#8355 and objectui#10321 still reach
a named view. The protocol now refuses `calendar.dateField` / `calendar.endField`
and `kanban.groupBy` itself (`unrecognized_keys`, naming the key). The two checks
on the `object-view` door add this repository's pointer at the key:
`Did you mean dateField → startDateField?`, `endField → endDateField`, or
`groupBy → groupByField`. Without them, only the protocol's near-miss hint would
answer, and for `dateField` that hint says `endDateField`. The legacy
`options.calendar` / `options.kanban` nesting is refused whole (`options` by
name) rather than judged inside.

**Keys the protocol's blocks do not declare are refused on a named view.** The
by-reference record judges each view-kind block with the protocol's strict block,
so a renderer-ahead knob or legacy alias inside one is an authoring error now.
Measured on 17.4.0: `kanban.titleField` / `groupField` / `swimlaneField` /
`conditionalFormatting`, `gallery.imageField`, `timeline.dateField` / `endField`,
`calendar.allDayField` / `defaultView` and `map.style`. `ObjectView` still reads
them off a named view that reaches it unvalidated, so a stored body keeps
rendering. Use the canonical key where one exists (`groupByField`, `coverField`,
`startDateField`, `grouping` for swimlanes).

**Superseded statements in this release.** Pending entries for objectui#7779,
objectui#8355 and objectui#10321 say `ObjectViewSchema.listViews` stays
unmirrored, and the objectui#8355, #8365, #9242 and #10321 entries say the
named-view doors judge the `options` nesting. This entry supersedes both: the key
is mirrored by reference, and the `options` bag is refused whole.

`NamedListView` is exported, and this entry does not change it (objectui#7924's
own entry in this release retires its `densityMode`). It no longer types
`ObjectViewSchema.listViews` or `ObjectView`'s named-view config. Its retirement
or narrowing follows objectui#7924's ruling A′ and the ruling on `allowExport`,
not this entry.
