---
---

Measure `NamedListView`'s per-member liveness and pin it (objectui#7924).

The declared set is now walked with the TypeScript parser rather than a regex,
the named-view read set is derived through every route from `schema.listViews`
to a named view (with every occurrence of that record classified, so a new
route fails instead of shrinking the reading), and each declared member is
pinned by name on its side of the partition — 6 read, 41 unread of 47 when this
entry was written; ⚠️ re-taken at objectui#8980, which declared the seventeen
members the protocol declares on this surface, so the partition is 21 read and
43 unread of 64 today — so a member moving between the two sets fails in either
direction.

⛔ Measurement only: neither declaration face moved, and the disposition for the
unread members (`?: never` tombstones vs. making the renderer read them) stays
with objectui#7928. Test only; no package is released by this change.
