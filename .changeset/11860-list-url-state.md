---
'@object-ui/app-shell': patch
---

A console object list's Filter panel conditions, search term and sort are now in the URL, so a filtered, sorted list can be shared as a link or bookmarked (objectui#11860).

The list writes them into the `uf_` query parameters it already uses for quick filters, under three new names:

- `uf__filter`: the Filter panel's group, as `{ logic, conditions }`. Each condition is one `@objectstack/spec` view filter rule (`{ field, operator, value }`), the shape a saved view stores. The panel's AND/OR choice is kept.
- `uf__search`: the search term.
- `uf__sort`: the sort, as the spec's list-view `sort` array (`[{ field, order }]`). A cleared sort is written as `[]`.

How a list opens:

- **A URL that carries list state opens that list.** This covers an opened link, a reload and Back. The URL's state replaces the per-browser filter and search memory entirely, so everyone who opens a shared link sees the same list. A piece the URL does not carry starts empty.
- **A URL with no list state restores the per-browser memory**, as before. The address bar then shows the restored filter and search, so a copied link includes them. A sort the URL does not carry is the view's own sort.
- **Malformed or out-of-date entries are dropped.** This applies to a value that is not valid JSON, a condition or sort entry the spec rejects, and a field the object no longer has or the user may not read. The list still opens, and the dropped entry is removed from the address bar.

Each change replaces the current history entry rather than adding one, so Back leaves the list in one step. Switching to another view opens it without the previous view's parameters. When a URL carries a sort, the list's "reset to default" returns to that sort.

Panels and dialogs are not written to the URL; opening or closing the Filter panel or the search box leaves it unchanged.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The per-browser filter memory is unchanged.
