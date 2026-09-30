---
'@object-ui/plugin-view': patch
---

**Bug fix:** a non-grid `object-view` (calendar / kanban / gallery / timeline)
whose sort came from the deprecated `table.defaultSort` no longer comes back
empty. `ObjectGridSchema.defaultSort` is declared a single `{ field, order }`
object, and `ObjectView`'s own fetch handed it to `$orderby` verbatim — where
the ObjectStack adapter reads it as an `$orderby` map and folds it with
`Object.entries`, so the request went out sorting by two columns literally
named `field` and `order`. The server answers `400 INVALID_SORT`, `ObjectView`
swallows the error, and the view rendered with no records — while the *same*
metadata sorted correctly as a grid, because `ObjectGrid` lowers that pair
before using it (objectui#4869, maintainer ruling 2026-08-22).

At this change `ObjectView` performed the same legacy-to-canonical lowering
`ObjectGrid` then did (`sort ?? (defaultSort ? [defaultSort] : undefined)`) and
routed the whole chain — named view sort, `views` prop sort, `table.sort`,
`table.defaultSort` — through the shared `convertSortToQueryParams` sink. This
was the last object-bound read site sending an authored sort to `$orderby`
unlowered; every other block (gantt, map, calendar, timeline,
`record:line_items`) already did, so an adapter that implements `find` itself
now receives one normalized `Record<field, direction>` from all of them instead
of two different dialects.

Precedence was unchanged, and at this change both spellings of the pair kept
working. The shared sink was deliberately **not** widened to accept a bare
`{ field, order }`: its input slot also legitimately carries `$orderby`'s own
map, in which `{ field: 'desc' }` is a valid ordering by a column named `field`,
so widening it would make one shared function guess.

⚠️ **Dated note, 2026-09-25 — the legacy half of that pair has since been
retired — objectui#5861.** Later in this same release `table.defaultSort` became
an ADR-0049 retirement tombstone: `ObjectView` no longer lowers or forwards it on
any path and `ObjectGrid` no longer reads it, so a view whose only sort is
`table.defaultSort` now renders **unsorted** (no longer empty, and no longer
sorted). The paragraphs above are kept as the reading of this change. What still
ships from it is the canonical chain — named view sort, `views` prop sort,
`table.sort` — reaching the shared sink; the objectui#5861 entry states the
migration (`sort: [{ field, order }]`).

Two visible shape changes on the wire, both semantically identical to before: a
string `table.sort` such as `'name desc'` now serializes as `-name` rather than
riding through as `name desc`, and a `SortConfig[]` arrives as a map rather than
as an array.
