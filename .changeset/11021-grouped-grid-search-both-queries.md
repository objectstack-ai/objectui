---
'@object-ui/plugin-grid': patch
---

fix(plugin-grid): a search reaches the grouped grid's header query and every group's row query, so the groups are the searched ones

A grid that groups on the server asks two queries: the group header query (the
set of groups and every count) and one row query per open group. Each group's
row query stripped `$search` / `$searchFields`, and the header query was asked
with `where` only, because the header query had no search keys. So a grid
carrying a search term drew the UNSEARCHED groups, with no word that the term
had been dropped.

`@objectstack/spec` 17.5.0 declares ADR-0061 `search` / `searchFields` on
`EngineAggregateOptions` beside `where` (objectstack#20487), and the platform's
grouped branch honours them. The grid now sends the term on both queries, as
one pair read off the row query each group's page is asked with
(`groupSearchOf`). A searched grouped grid shows only the groups that hold
matching rows, each header counts its matching rows, the rows under it are
those rows, and clearing the term restores the unsearched groups. The
ObjectStack adapter already posts the header query verbatim, so it needs no
change.
