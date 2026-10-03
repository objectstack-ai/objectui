---
'@object-ui/app-shell': patch
---

fix(app-shell): an interface page relays its source view's `tree` and `chart` blocks, and its own `allowPrinting` (objectui#11572)

An interface page builds the list schema it hands `ListView` itself, key by key,
out of its page config and the view its `sourceView` names. That projection
carried the visualization blocks of `kanban`, `calendar`, `gallery`, `timeline`,
`gantt` and `map` only. A page whose `appearance.allowedVisualizations`
whitelisted `tree` or `chart` therefore drew that kind with no block: a stored
`{ type: 'tree', tree: { parentField: 'parent_id' } }` view reached the tree with
no parent pointer, and a chart view lost its binding, while the object page drew
the same stored view correctly.

The declared `tree` and `chart` blocks now travel whole, as the other per-kind
blocks do. Neither kind has a page-derived default, so a whitelisted tree or
chart whose view declares no block still reaches the renderer with none, as
before.

The page config's own `allowPrinting` ("Allow users to print the page") was
dropped the same way: nothing wrote it, so the declared toggle never drew a print
button. It now reaches the list. The source view's `allowPrinting` does not stand
in for the page's, the same rule as `showRecordCount`.

A census pin now derives every member `ListView` reads from its source and
requires the interface page to relay each one or answer it as deliberately not
relayed, with a reason and mechanical evidence, so a newly read member that is
neither fails by name.
