---
'@object-ui/app-shell': patch
---

A console list's view-tab switch starts the next view with the quick-filter selections its own URL carries (objectui#11992). The object page read the `uf_FIELD` selections once per page mount. A switch keeps the page mounted, so every view after the first restored the first view's selections. For example, after `view/qa?uf_priority=urgent`, the `qb` tab queried `priority = urgent` and its chip showed one selection, while its address bar carried no `uf_` param. A link copied there did not reproduce the list on screen.

The page now reads the selections from the current location once per list (object and view), the same identity it already seeds the Filter panel, search and sort on (objectui#11915). A view tab, which navigates to a bare path, opens the next view with no quick filter. A link or Back to a filtered entry restores that entry's selections. A fresh load of a filtered link still applies them. The per-user cache keeps its precedence, and a view switch writes the address bar no more than before.

Nothing is added to or removed from the package entry: no export, prop, type member or language-pack key.
