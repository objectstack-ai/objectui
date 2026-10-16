---
'@object-ui/plugin-list': minor
'@object-ui/app-shell': patch
---

A console object list's toolbar grouping is now in the URL, beside its Filter panel conditions, search term and sort, so a grouped list can be shared as a link or bookmarked (objectui#11860).

`ListView` (`@object-ui/plugin-list`) has a new optional prop, `onGroupingChange`. It fires when the user changes the grouping in either grouping editor: the toolbar's Group panel (adding, changing or removing a level, or Clear) and the compact toolbar's View settings popover. The value is the `@objectstack/spec` `GroupingConfig` (`{ fields: [{ field, order, collapsed }] }`), the shape `schema.grouping` takes, or `undefined` when the grouping is cleared. It does not fire when the list re-reads a changed `schema.grouping` from its host. A host that does not pass it behaves as before.

The console object page (`@object-ui/app-shell`) writes that value into a fourth `uf_` query parameter, `uf__group`, as JSON, and opens a list grouped by it:

- **A URL that carries a grouping opens the list grouped that way**, over the grouping the view declares. A URL without one opens the view's declared grouping.
- **Malformed or out-of-date groupings are dropped.** This applies to a value that is not valid JSON, a grouping or level the spec's `GroupingConfigSchema` rejects, and a field the object no longer has or the user may not read. The list still opens, and the dropped entry is removed from the address bar.
- Each change replaces the current history entry. Clearing the grouping removes the parameter; the spec has no empty grouping, so a link to a view that declares a grouping cannot carry "no grouping". Switching to another view opens it on its own grouping. Opening or closing the Group panel leaves the URL unchanged.

The grouping is written to the URL only: it is not stored on the view or in the per-browser filter memory.

Also fixed on the console object page: a link's `uf__sort` now sorts the list on a view that declares a sort of its own. Before, the view's declared sort overrode it, so the link's sort showed in the address bar while the list stayed in the view's order.
