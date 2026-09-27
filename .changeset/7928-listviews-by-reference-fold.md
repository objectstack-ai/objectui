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

The calendar-alias pointer from objectui#8355 still reaches a named view. The
protocol now refuses `calendar.dateField` / `calendar.endField` itself, and the
check adds `Did you mean dateField → startDateField?` (or `endField →
endDateField`) at the key. Without it, only the protocol's near-miss hint would
answer, and that hint says `dateField → endDateField`.

`NamedListView` is exported and unchanged. It no longer types
`ObjectViewSchema.listViews` or `ObjectView`'s named-view config, and
objectui#7924 decides whether it is retired.
