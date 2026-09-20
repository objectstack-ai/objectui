---
"@object-ui/plugin-list": patch
---

fix(plugin-list): stop re-issuing the identical records query on every visualization switch

`ListView`'s fetch effect named `currentView` in its dependency list, so
switching between Grid, Kanban, Calendar and the other visualizations re-ran it
— but the query it builds never reads the current visualization. The only way a
surface reaches the wire is the `$skip` of its window, and on page 1 that number
is 0 for a flat grid and 0 for every other surface, so the re-issued request was
byte-for-byte the one already on screen. A board reached through a view switch
therefore cost two identical `GET /api/v1/data/<object>?top=…&select=…` round
trips before its first paint.

The effect is now keyed on the window itself (`fetchSkip`), and the two
surface-shaped readings the fetch used to latch — the server total behind the
grid's pager, and the row-cap banner's "…but the real total is known" half — are
derived at render instead. Every re-fetch that changes the window is kept:
turning the page still refetches, and leaving a paged grid from page 3 for a
board that consumes the whole batch still refetches. What is gone is the
round trip that changed nothing.
