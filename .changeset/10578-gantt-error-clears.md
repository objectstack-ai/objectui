---
'@object-ui/plugin-gantt': patch
---

fix(plugin-gantt): a failed load no longer keeps `ObjectGantt` on its error screen after a later load succeeds

`ObjectGantt` sets `error` when the current reload fails, and the render returns
the error screen early whenever `error` is set. Nothing ever cleared it. After one
failed load (a filter or sort change against a flaky backend, say), every later
load that succeeded still wrote its rows, but the chart stayed on the error screen
until the component remounted.

The current reload now clears the error in two places:

- A non-silent reload (a changed query) clears it when it starts, as
  `ObjectGrid`'s load does. The first load still shows the loading placeholder, and
  a query change after the chart has painted still shows the chart under its
  refreshing state. If the new query fails too, its own failure is reported.
- Any reload clears it when it commits rows. That covers a silent re-read that
  succeeds after an error, such as the one a data-invalidation triggers: it re-read
  the current query, so its rows answer that query.

A silent reload never clears the error when it starts. Its failure is not
reported, so clearing first could leave rows from an older query on screen with
nothing to say so. A superseded reload's answer is discarded under the existing
`isCurrent()` guard, and its clear is discarded with it, so it cannot remove an
error the current reload reported.
