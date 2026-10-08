---
'@object-ui/types': minor
---

feat(types)!: the list view's `kanban`, `calendar`, `gallery` and `timeline` blocks are the `@objectstack/spec` 17.7.0 `ListViewSchema` slots by reference, and their `.passthrough()` is gone (objectui#6152, round 11)

Clause-②: no

**Narrowed (breaking).** `@objectstack/spec` 17.7.0 judges each per-view-type block of a list view as
a strict object. `@object-ui/types` kept the four as the named spec schema `.partial()` plus
`.passthrough()`, with four accepted aliases and an objectui-only `calendar.defaultView`. So
`ListViewSchema`, `AnyComponentSchema`, `safeValidateSchema` (`objectui validate`) and the TypeScript
`ListViewSchema` accepted what the spec refuses. The strict authoring face, `StrictAnyComponentSchema`,
narrows too: it already refused an undeclared key, but it accepted the aliases, `calendar.defaultView`
and a calendar block without `startDateField`. Each block is now the spec's own slot, taken by
reference, and the TypeScript face derived from it loses its index signature. What is refused now,
and what to write instead:

- An undeclared key on any of the four blocks (for example `kanban.swimlaneField` or
  `timeline.endField`) is refused with the spec's own `unrecognized_keys` at the block. Before this
  change it was kept and never examined.
- `kanban.groupField` is refused by name: write `groupByField`.
- `kanban.cardFields` is refused by name: write `columns`.
- `gallery.imageField` is refused by name: write `coverField`.
- `timeline.dateField` is refused by name: write `startDateField`.
- `calendar.defaultView` is refused by name: the spec has no such member on a list view's calendar
  block. The initial view mode is a member of the `object-calendar` element (its flat `defaultView`).
- A list view's `calendar` block without `startDateField` is refused at `calendar.startDateField`,
  as the spec refuses it. `kanban` and `timeline` stay `.partial()`, because app-shell's derived
  defaults leave out `columns` and `titleField`, and the gallery block requires nothing.

Each by-name refusal reports `invalid_type` at the key's own path, with the spec's own lead sentence
followed by the canonical key. The refusals already in place (`kanban.groupBy`, objectui#8365;
`calendar.dateField` / `calendar.endField`, objectui#8355) are unchanged. Round 9 of this card
(the `object-calendar` element's container) left this list-view block open; this change closes it.

What did not move: the renderers. `normalizeListViewSchema` still folds the four aliases onto their
canonical keys, and `ListView` still lifts `calendar.defaultView` and spreads the rest of the kanban
and calendar blocks onto the node it builds. A view stored with one of these keys therefore renders as
before; only authored metadata meets the refusal. The legacy `options.KIND` bag is unchanged.
