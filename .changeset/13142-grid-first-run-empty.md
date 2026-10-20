---
'@object-ui/plugin-grid': patch
---

An empty `object-grid` no longer tells the user to adjust filters they never set (objectui#13142).

With no authored `emptyState`, a grid with no record fell through to the table's own empty row, "No results found / Try adjusting your filters or search query.", even over an object that simply had no record and a grid nobody had searched. The grid now tells the cases apart, with the copy the list view's empty state already uses:

- no search term and no declared filter: "Nothing here yet / Create your first record to get started.";
- a declared filter alone: "No matching records / No records match this view's filter.";
- a search term (the grid's own box, or the host's `search`): the table keeps its "No results found" row and its search box, as before.

An authored `emptyState` still wins wherever it was drawn before. No prop, schema key or language-pack key is added: the copy is the existing `list.*` keys.
