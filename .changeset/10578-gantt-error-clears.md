---
'@object-ui/plugin-gantt': patch
---

fix(plugin-gantt): a failed load no longer keeps `ObjectGantt` on its error screen after a later load succeeds

`ObjectGantt` sets `error` when the current reload fails, and the render returns
the error screen early whenever `error` is set. Nothing ever cleared it. After one
failed load (a filter or sort change against a flaky backend, say), every later
load that succeeded still wrote its rows, but the chart stayed on the error screen
until the component remounted.

The current reload now clears the error when it commits rows, whether it is a
changed query or a silent re-read of the same one (a data-invalidation, say). Those
rows answer the current query, so the earlier failure no longer describes the
screen. A superseded reload's answer is discarded under the existing `isCurrent()`
guard, and its clear is discarded with it, so it cannot remove an error the current
reload reported.

The error is deliberately not cleared when a reload starts, although `ObjectGrid`'s
load clears there. A silent re-read can overtake a changed query and then fail
without reporting it. Had the changed query cleared the error when it started, the
chart would go back to an older query's rows with nothing to say they are stale.
Until rows that answer the current query land, the error stays on screen. Before the
first paint the loading placeholder still shows while a query is in flight.
