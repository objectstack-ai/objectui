---
'@object-ui/plugin-grid': minor
'@object-ui/plugin-list': minor
'@object-ui/i18n': minor
---

A grouped grid over a data source that declares no `queryGroupHeaders` now
**refuses grouping** instead of grouping a page of rows (objectui#10881,
maintainer ruling F). Grouping is a property of the query (ruling A on
objectui#7189): a data source that cannot answer the group header query cannot
group, so the grid names the member it is missing rather than drawing counts it
cannot know.

- **`@object-ui/plugin-grid`** — a grouped `object-grid` that fetches its own
  rows over such a source renders an error panel naming `queryGroupHeaders`
  and issues no row query. It used to fetch one window and group it in the
  browser, so every group count was a page slice and a group whose rows all
  fell past the window was missing. Rows handed in WHOLE — a
  `data: { provider: 'value', items }` block, or a `data` prop from a parent
  view that declares no larger `rowCount` — are still grouped in the browser,
  exactly. A host that hands rows in while declaring them one page of more
  (the external-pagination props: `manualPagination`, `onPageChange` and a
  `rowCount` above the rows it handed) is now refused as well, with a sentence
  of its own: grouping needs every record. It used to have that page grouped as
  if it were whole.
- **`@object-ui/plugin-list`** — `ListView` makes the same refusal, with the
  same sentence, in place of a grouped grid over such a source, and fetches no
  window for it. It used to fetch one window and hand it to the grid as
  `data`, which the grid grouped as if the rows were whole. Rows handed to
  `ListView` in whole are still handed to the grid.
- **`@object-ui/i18n`** — two new keys, `grid.grouping.needsHeaderQuery` and
  `grid.grouping.needsWholeRows`, in all ten locale packs.

The `Partial` marker described by the pending
`7189-grouped-grid-partial-disclosure` entry is retired everywhere before any
release carried it: its three `grid.grouping.partial*` strings, `GroupRow`'s
`partialLabel` / `partialTitle` props and the notice above the group list are
gone.

**Breaking semantics (declared `minor` per this repo's version policy):** a
grouped grid that fetches its own rows over a data source without
`queryGroupHeaders` — `ApiDataSource`, `ValueDataSource`, or a host adapter —
grouped the page it fetched in the last release, and now renders an error panel
instead. So does a grouped grid view in `ListView` over such a source. So does
a grouped grid handed rows by a host that declares them one page of more
(`manualPagination`, `onPageChange` and a `rowCount` above the rows handed),
whatever its data source. To keep grouping, either:

- implement `queryGroupHeaders` on the data source (the ObjectStack adapter
  does), and let the grid fetch its own rows, or
- hand the rows in whole (`data: { provider: 'value', items }`, or a `data`
  prop with no `rowCount` above it).

Not changed here: while a toolbar search is active, `ListView` over a data
source that answers the header query still hands a grouped grid its window,
whose group counts are the window's, because the header query carries no
search (objectstack#20358).
