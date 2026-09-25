---
'@object-ui/plugin-calendar': patch
---

fix(plugin-calendar): a failed load no longer keeps `ObjectCalendar` on its error screen after a later load succeeds (objectui#10663)

`ObjectCalendar` set `error` when its fetch failed, and the render returns the
error screen early whenever `error` is set. Nothing ever cleared it. Every later
load that succeeded still wrote its events, but the calendar stayed on the error
screen until it remounted. Since objectui#10572 the calendar re-reads on every
data-invalidation event, so one failed background re-read was enough.

The current run of the fetch now clears the error when it commits rows, on each
of its commit branches: those rows answer the current query, so the earlier
failure no longer describes the screen. This is the rule objectui#10578 set for
`ObjectGantt`. The clear sits inside the run's existing `isMounted` guard, so a
superseded run cannot clear the current run's error. The error is not cleared
when a run starts; it stays until rows land.

Rows a parent hands over through `data` clear it too, beside the row-ceiling
reset that already sits there for the same reason: those rows are not the query
that failed.

A failed background re-read is still reported: the calendar has no silent mode,
so it shows the error screen rather than keeping the last good events, and the
next re-read that succeeds takes the screen back.
