---
'@object-ui/plugin-timeline': patch
---

fix(plugin-timeline): a failed load no longer keeps `ObjectTimeline` on its error screen after a later load succeeds (objectui#10663)

`ObjectTimeline` set `error` when its fetch failed, and the render returns the
error screen early whenever `error` is set. Nothing ever cleared it. Every later
load that succeeded still wrote its rows, but the timeline stayed on the error
screen until it remounted. Since objectui#10623 the timeline re-reads on every
data-invalidation event, so one failed background re-read was enough.

The current run of the fetch now clears the error when it commits rows: those
rows answer the current query, so the earlier failure no longer describes the
screen. This is the rule objectui#10578 set for `ObjectGantt`. The error is not
cleared when a run starts; it stays until rows land.

Only the current run writes the error at all. A run that a newer one has
superseded can no longer clear the current run's error, or put the error screen
over the current run's rows.

A failed background re-read is still reported: the timeline has no silent mode,
so it shows the error screen rather than keeping the last good rows, and the
next re-read that succeeds takes the screen back.
