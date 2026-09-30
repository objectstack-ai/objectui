---
'@object-ui/plugin-list': patch
'@object-ui/plugin-grid': patch
---

fix(plugin-list,plugin-grid): a grouped list view under a toolbar search groups on the server, and each group counts all its matching rows

A grouped list view whose data source answers the group header query hands
the grid its own fetch, so the groups and their counts come from the server.
A toolbar search used to take that back: the list view fetched one page of
searched rows and the grid grouped that page in the browser, so once the
matches outnumbered the page a group's count was the page's slice of it, and
a group whose matches all fell past the page was missing.

The list view now hands the grid its toolbar term (the grid's `search` prop)
and the view's `searchableFields`, and the grid sends them on the group header
query and on every group's row query. A searched grouped list view shows only
the groups that hold matching rows, each counting all its matches, and
clearing the search restores the unsearched groups.

`ObjectGrid` now reads a host's `search` whenever one is passed, not only
under host-driven paging: the host then owns the term, and the grid's own
queries carry it. Turning grouping back on no longer asks for, or briefly
shows, the groups of the query the grid held when it last grouped (a cleared
search, or an old filter or sort). `@object-ui/plugin-grid` now declares
`@objectstack/spec` `^17.5.0`, the release whose group header query takes a
search.
