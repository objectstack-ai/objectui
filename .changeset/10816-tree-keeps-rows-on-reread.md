---
'@object-ui/plugin-tree': patch
---

fix(plugin-tree): `object-tree` keeps its rows on screen while it re-reads them

`ObjectTree` drew its "Loading…" placeholder whenever a read was in flight, so
every re-read — each data-invalidation event for its object among them — took
the table off the screen and put it back: the rows flashed, and a scrolled tree
lost its scroll offset.

The placeholder is now drawn only while the tree has no rows for the source it
is bound to: the first load, a switch to another object or data provider, and an
empty result being re-read. A re-read of the same source keeps the rows, the
scroll container and the user's expansion choices on screen, with the shared
`RefreshIndicator` bar across the top of the tree while the read is in flight
(named through the locale's `grid.refreshing`). The previous object's rows are
never drawn under a new object or provider.
