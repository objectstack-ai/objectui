---
'@object-ui/plugin-grid': patch
'@object-ui/i18n': minor
'@object-ui/types': patch
---

A paged grid's column footer reads the whole matched set, or says it reads the page (objectui#12081 item 3).

Under server paging a grid holds one page of the matched set, and the footer summed that page and drew the figure beside the count of the whole set: "Planned Amount: Sum: 3,685,900.00 · 300 records", where the 300 rows sum to 40,607,000. Every footer aggregate had the same fault (`count`, `avg`, `min`, `max`, the filled, empty and unique counts, and the two percents).

- **The whole set's figures, from the server.** When the rows are one page of more, the grid asks for the figures in ONE aggregate query through the data source's `queryGroupHeaders`, with no `groupBy`. The query is the one behind the rows: its filter, search and search fields, without its page, sort or projection. Turning the page or sorting asks nothing. A refresh or a write to the object asks again. These figures are the server's, so "empty" means a stored `null`. This holds both when the grid fetches its own rows and when a host such as `ListView` hands it one page with `manualPagination`, `rowCount` and `findParams`.
- **Otherwise, the page's figure, labelled as the page's.** The grid uses the answer only when its row count equals the count the grid shows. Otherwise the footer shows the page's figure as `Sum (this page): 32,500`. That happens when the data source has no `queryGroupHeaders`, refuses the query or answers without one row, when the query carries a key this read cannot repeat, and when the count shown is an estimate. The platform's paged count under a search is one.
- **Unchanged:** rows handed in whole, and a grid whose one page holds every match, keep the footer they had and ask the server nothing. A grid whose columns declare no summary that maps to an aggregate (none at all, only `none`, or only unknown members) asks nothing either: it has no footer. `useColumnSummary` keeps its signature and still summarises the rows it is handed.

Added: one language-pack key, `grid.summary.pagePattern`, in all ten packs. The `DataSource.queryGroupHeaders` doc comment now says what the same query with no `groupBy` answers. No export, prop or type member is added.
