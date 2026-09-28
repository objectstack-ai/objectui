---
'@object-ui/types': minor
'@object-ui/data-objectstack': minor
'@object-ui/plugin-grid': minor
'@object-ui/plugin-list': minor
---

Grid grouping is now **server-side** (objectui#7189, maintainer ruling A): the
set of groups and every number in a group header — the count and any per-group
aggregation — come from the query, and the rows inside a group are paged by the
server.

Before, a grouped grid fetched one window and bucketed it in the browser, so
both the group set and every header number were properties of the page. On a
store of 186 records over five business units sized 86 / 61 / 31 / 7 / 1 with a
100-row page it rendered **two** headers (86, 14) when the rows were stored
contiguously and five page slices (31 / 31 / 30 / 7 / 1) when interleaved — and
the records past the window were not on a second page, they were unreachable.
The same store now renders five headers reading 86 / 61 / 31 / 7 / 1 in either
order, and every record is reachable through its group's own pager.

- **`@object-ui/types`** — `DataSource` gains an optional
  `queryGroupHeaders(resource, query)`: it answers the group header query
  `@objectstack/spec/ui`'s `compileListViewGroupQuery` compiles (an
  `EngineAggregateOptions`) with one header row per group. Presence is the
  capability; a source that cannot answer it leaves it undeclared.
- **`@object-ui/data-objectstack`** — `ObjectStackAdapter.queryGroupHeaders`
  posts the compiled query verbatim to the existing `POST /data/:object/query`
  door and answers its `records`. It never degrades: a refusal throws, and a
  body without `records` is refused rather than read as "no groups".
- **`@object-ui/plugin-grid`** — a grouped grid that fetches its own rows from a
  source declaring `queryGroupHeaders` asks for its headers (one compiled query
  per grouping level) and pages each **open** group's rows with the group's
  own compiled row query (`compileListViewGroupRowsQuery`: the view's filter AND
  the group key, `limit` / `offset` per group); a collapsed group costs no row
  query, `aggregations` are the header query's numbers, and a reference-typed
  grouping key is labelled from the referenced record. Such a grid's column
  sort is the server's, and it no longer shows the `Partial` marker: its counts
  are the query's own. Rows handed in whole are still grouped in the browser
  (exact), and a source with no header query still groups the page it fetched
  and still marks it partial.
- **`@object-ui/plugin-list`** — `ListView` hands a grouped grid its own fetch,
  with the view's effective filter, when the data source can answer the header
  query, and draws no record-count bar over it. While a toolbar search is
  active it keeps hosting the rows as before: `$search` has no counterpart on
  the header query.

**Breaking semantics (declared `minor` per this repo's version policy):**

- A grouped grid over a capable source sends different requests: one header
  query per grouping level plus one row query per open group, instead of one
  window. A host that counted or mocked the single window sees the new shape.
- `useGroupedData` takes an optional fifth argument (the server's header rows).
- `GroupEntry` gains two REQUIRED members: `count` (the group's size — use it
  instead of `rows.length`, which is empty on a server-grouped grid) and
  `keyValues`. Code that only READS a `GroupEntry` is unaffected; code that
  CONSTRUCTS a `GroupEntry` literal no longer type-checks until it supplies
  both.
- `AggregationResult.value` is `number | null`, `null` being what the server's
  aggregate answered over no values (rendered as a dash, never invented as 0).
- `@object-ui/plugin-grid` and `@object-ui/data-objectstack` now require
  `@objectstack/spec` `^17.4.0`, the first release that ships the group-query
  compilers.

This supersedes the last paragraph of the pending
`7189-grouped-grid-partial-disclosure` changeset, which said server-side
grouping was not built: it now is, and the `Partial` marker described there
remains only for the data sources that cannot answer the header query.
