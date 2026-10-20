---
'@object-ui/plugin-list': minor
'@object-ui/plugin-view': minor
'@object-ui/types': minor
'@object-ui/app-shell': minor
---

The list view's Filter panel no longer narrows its field list to a per-view `filterableFields` whitelist (objectui#13118). `@objectstack/spec` 18 retires the list view's `filterableFields` (objectstack#24640, maintainer ruling C), and no per-view Filter-panel whitelist replaces it. The Filter panel offers every field the user may read, minus the fields the object marks `hidden: true`, which is what it already offered a view that declared no whitelist. A hidden field still appears when a condition the panel holds filters on it.

- **`ListView`** (`@object-ui/plugin-list`) reads `filterableFields` nowhere. A stored view that still carries the key gets the same Filter-panel list as a view without it. The spec's conversion drops the key from stored and authored views, so no new source carries it.
- **The relays** stop forwarding the key: the `object-view` delegation in `@object-ui/plugin-view` (from the named view, the host `views` entry and the node) and the object page in `@object-ui/app-shell` (from the active view). The `object-view` registration no longer publishes `filterableFields` as an input.
- **`@object-ui/types`** declares `NamedListView.filterableFields` as a `?: never` tombstone, so a TypeScript author who writes the key on a named view is refused by name. `ObjectViewSchema.filterableFields` is deprecated and typed by reference to the list view's spec slot, the same slot its Zod mirror carries, so the `@objectstack/spec` pin bump that takes the retirement refuses it on both faces at once.

BREAKING (`@object-ui/types`, `@object-ui/plugin-view`, `@object-ui/plugin-list`, `@object-ui/app-shell`), for a TypeScript caller or a view that passes `filterableFields`: the key no longer compiles on `NamedListView` (and on `ObjectViewSchema` from that pin bump on), and no renderer narrows the Filter panel to it. Delete the key. For a curated end-user filter bar, author `userFilters` on the list view, for example `userFilters: { element: 'dropdown', fields: [{ field: 'stage' }] }`. There is no replacement for a per-view Filter-panel whitelist: field-level read security decides which fields a user may filter on, and `hidden: true` on the object's field keeps a field out of the panel. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

Clause-②: no (narrowing)
