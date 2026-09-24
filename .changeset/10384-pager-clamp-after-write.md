---
'@object-ui/plugin-list': patch
---

`ListView` no longer strands a server-paginated grid on a page a write has emptied. When a refetch comes back with zero rows past page 1 and the server's `total` says the last page is lower, the pager steps back to that last page and fetches it, showing a loading state in between. Before, bulk-deleting every row of the last page (or a concurrent delete) left the list on that page with the first-run "no records yet" empty state, although earlier pages still had records. A write that leaves the current page non-empty keeps the page, and an object with no records still shows the first-run empty state on page 1.
