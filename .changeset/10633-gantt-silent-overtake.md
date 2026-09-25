---
'@object-ui/plugin-gantt': patch
---

fix(plugin-gantt): a silent re-read that overtakes a changed query now reports that query's failure

`ObjectGantt` re-reads in two modes. A changed query (a sort, filter or search
change) reports a failure on the error screen. A silent re-read of the same query
(a data-invalidation, the toolbar refresh, or the read-back after a drag, resize or
inline edit) only logs a failure and keeps the last good rows, because those rows
still answer that query.

Only the newest re-read may commit, so a silent re-read that starts while a
changed query is still in flight makes that query's run stale. The re-read reads
the changed query too. When it failed, the chart kept the rows of the query before
the change, with no error and no refreshing state. Those rows answer neither query
the user asked for.

A silent re-read that overtakes a changed query in flight now takes over that
query's report: its failure shows the error screen, as the changed query's own
failure would. The report passes on if another silent re-read overtakes it, and it
is released when the current re-read settles. The same holds for a silent re-read
that overtakes the initial load, which used to leave an empty chart with no error.
A silent re-read with nothing pending still only logs a failure and keeps its rows.
No prop or export changes.
