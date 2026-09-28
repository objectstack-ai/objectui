---
'@object-ui/plugin-dashboard': patch
---

fix(plugin-dashboard): a dashboard filter's `optionsFrom` options re-read on the data-invalidation bus

A `select` or `lookup` entry in a dashboard's `globalFilters` that reads its
options through `optionsFrom` now re-reads them when the bus reports a change to
`optionsFrom.object` (`notifyDataChanged`, as a page action over raw HTTP
does), or an unscoped `'*'`, on either read: the server-side dataset GROUP BY
and the client-side `find` fallback. A change to another object does not
re-read. The options on screen stay until the re-read answers, and the value the
user selected is kept: it is the dashboard variable's, and the read never writes
it. Before, the options refreshed after such a write only when the host
remounted the dashboard, and `PageView` is about to stop doing that
(objectui#10519).

A filter with authored `options` and no `optionsFrom` reads nothing and does not
subscribe.

**Clause-②: no** — no exported symbol, prop or authored key is added, removed,
renamed or retyped, and no accept set moves. What changes is when an existing
read runs.
