---
'@object-ui/types': minor
'@object-ui/plugin-grid': minor
'@object-ui/plugin-view': minor
---

Retire `object-grid`'s `defaultSort` and `object-view`'s `table.defaultSort`
(objectui#5861 — ADR-0049 enforce-or-remove, the "C half" of the 2026-08-22
ruling on objectui#4869).

**BREAKING for the legacy spelling, deliberately.** `defaultSort` was the
single-entry `{ field, order }` spelling of `sort`. `@objectstack/spec` 17.3.0
turned `ObjectGridProps.defaultSort` into a retired-key tombstone, so the
protocol already refuses an authored value by name; the renderers were the last
place that still honoured it. Every read goes in this one change, so no path
honours the key while another ignores it:

- `@object-ui/plugin-grid` — `ObjectGrid` no longer lowers `defaultSort` into
  `$orderby` and no longer falls back to it for the header sort arrows. The
  registered `sort` input's description no longer advertises it as a fallback.
- `@object-ui/plugin-view` — `ObjectView` no longer forwards `table.defaultSort`
  to the grid, no longer lowers it on the non-grid fetch (calendar / kanban /
  gallery / timeline / gantt / map), and no longer wraps it into the sort
  handed to a host's `renderListView`.
- `@object-ui/types` — the published faces narrow to match:
  `ObjectGridSchema.defaultSort` is now `?: never` (a TypeScript author who
  writes it gets a compile error), and the `ObjectGridSchema` zod mirror refuses
  it by name with a migration message. `ObjectViewSchema.table` inherits the
  `never` member. A tombstone rather than a deletion: `BaseSchema`'s index
  signature and `.passthrough()` would otherwise absorb the key silently.

A document that still carries `defaultSort` renders **unsorted** — it is not
re-routed into `sort`. Migrate by renaming the key and wrapping the value:
`defaultSort: { field: 'name', order: 'asc' }` becomes
`sort: [{ field: 'name', order: 'asc' }]`. `sort` already outranked
`defaultSort` wherever both were written, so documents that carry both keep
their current ordering.
