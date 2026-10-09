---
'@object-ui/types': minor
'@object-ui/app-shell': patch
'@object-ui/plugin-list': patch
'@object-ui/plugin-timeline': patch
---

feat(types)!: a list view's legacy `options` bag is the `@objectstack/spec` list overlay's bag by reference, `ListViewTimelineConfig` is the list view's own `timeline` block, and `ListViewGalleryConfig` is retired (objectui#6152, round 12)

Clause-②: no

**Narrowed (breaking), `@object-ui/types`.** `@objectstack/spec`'s authoring list view declares no
`options` bag. Its one home is the flattened list overlay on the view write door
(`VIEW_METADATA_MEMBERS.listOverlay`), where it is a strict object of the eight kinds that name a
block, each judged by its own list-view block with every key optional. `ListViewSchema.options` was
a record of `any` with three named refusals, so `ListViewSchema`, `AnyComponentSchema`,
`safeValidateSchema` (`objectui validate`), `StrictAnyComponentSchema` and the TypeScript
`ListViewSchema['options']` accepted what that door refuses. It is now that member's own bag, taken
by reference, with this package's `kanban`, `calendar`, `gallery` and `timeline` blocks in it, so
each named refusal gives the same message under `options.KIND` as under the top-level `KIND`. What is
refused now, and what to write instead:

- A key that is not one of the eight kinds is refused with the spec's own `unrecognized_keys` at
  `options`. `options.grid` gets the spec's guidance: a grid has no per-kind block, so its settings
  (`columns`, `sort`, `filter`, …) are top-level keys of the view. Remove it.
- An undeclared key in any kind (for example `options.kanban.swimlaneField`,
  `options.timeline.descriptionField`, `options.tree.titleField`, `options.chart.xAxisField`) is
  refused with the spec's own `unrecognized_keys` at that kind. Before this change it was kept and
  never examined.
- `options.kanban.groupField` is refused by name: write `groupByField`.
- `options.kanban.cardFields` is refused by name: write `columns`.
- `options.gallery.imageField` is refused by name: write `coverField`.
- `options.timeline.dateField` is refused by name: write `startDateField`.
- `options.calendar.defaultView` is refused by name: the initial view mode is a member of the
  `object-calendar` element (its flat `defaultView`), not of a list view's calendar block.
- `options.chart`'s legacy axes (`xAxisField`, `yAxisFields`, `categoryField`, `valueField`,
  `aggregation`) are refused: write the dataset-bound block, `chart: { dataset, dimensions, values }`.
- A value of the wrong type (for example `options.kanban: 42`, or a number where a field name
  belongs) is refused at its path.

The three refusals already in place (`options.kanban.groupBy`, objectui#8365;
`options.calendar.dateField` / `endField`, objectui#8355) keep their messages, and now report
`invalid_type` at the key, as the top-level blocks do, where they reported `custom`. Each kind is
`.partial()`, as the spec's bag is: the renderer reads the bag as a per-key underlay of the top-level
block, so a required member is not asked of it.

**Changed, `@object-ui/types`.** `ListViewTimelineConfig` is `NonNullable<ListViewSchema['timeline']>`:
the spec's list-view slot, strict and `.partial()`, with the legacy `dateField` refused by name
(write `startDateField`). It was the spec's `TimelineConfig` plus `dateField?: string` and a string
index signature of `any`, so a block with any key compiled.

**Retired, `@object-ui/types`.** The `ListViewGalleryConfig` type export is gone. Nothing in this
repository used it, and the spec has no element of that shape. Write the spec's `GalleryConfig`,
which this package re-exports.

**`@object-ui/app-shell`.** The object page's relay writes the spec's spellings into the bag it hands
`ListView`: `options.kanban.columns` where it wrote `cardFields`, no `options.gallery.imageField`
beside `coverField`, and no `options.timeline.descriptionField`. What renders does not change: the
board reads `columns` for its cards, the gallery reads `coverField` first, and nothing drew the
timeline's nested `descriptionField`.

**`@object-ui/plugin-list`.** `ListView`'s capability gate also reads `options.gallery.coverField`, so
a bag binding its cover under the spec's key offers the Gallery view; it read only the legacy
`imageField` there. The README's examples author the top-level per-kind blocks and a dataset-bound
chart, and no longer show the bag.

**`@object-ui/plugin-timeline`.** `ObjectTimeline`'s nested `schema.timeline` prop takes the new
`ListViewTimelineConfig`.

What did not move: the renderers' reads. `ListView` still merges each `options.KIND` under the
top-level block and still reads the legacy spellings, so a view stored before these doors closed
renders as before; only authored metadata meets the refusal.
