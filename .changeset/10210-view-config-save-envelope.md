---
'@object-ui/app-shell': patch
---

Saving a view's config no longer turns the view read-only (objectui#10210).

"Edit view config → Save" on a code-defined view used to store the flat view the
panel edits. The platform then copies `viewKind: 'list'` onto that row from the
code definition it shadows, and a flat row carrying `viewKind` was the shape the list
reader treated as a personalization overlay: the view dropped out of the saved views,
every mutating entry vanished from its tab menu except "Manage all views…", and
publishing the draft made that permanent.

The save now stores the same ViewItem envelope — `{ name, object, viewKind: 'list',
label, config }` — that creating a view already stores, under the same view name as
before, so the view keeps all six menu entries through draft preview, publish and
later toolbar changes. Its `config` holds only the keys a list view declares (the
platform refuses an envelope whose `config` carries the panel's own `id` or
`isDefault`), and the view's default flag, pin, order, visibility and column widths
are kept beside it.

Reopening the panel on a view with an unpublished change now resumes that change and
saves it back to the same view. Before, a stored envelope lost the view's identity on
the way into the panel and the next Save wrote nothing. A change saved before this
release is still stored flat and still resumes.

Views that an earlier save already made read-only are repaired on read, edits kept,
by the `@object-ui/data-objectstack` change for objectui#10210: the list reader no
longer treats that shape as an overlay unless the row carries the `_isOverride`
marker.
