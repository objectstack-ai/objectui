---
'@object-ui/plugin-view': patch
'@object-ui/app-shell': patch
---

A save, delete or other write no longer rebuilds the object view it happened in for most view types — the view refetches its rows in place and keeps its component state (objectui#10035).

Both `ObjectView` layers carried their refresh counter in a React `key`, so every write remounted the whole view and reset everything held in it: a calendar jumped back to the current month and its default mode, the object page's list lost its scroll position and the visualization picked in its own switcher. The counter now reaches the rendered view as a data signal instead:

- `@object-ui/app-shell`: the object page hands its refresh counter to `ListView` as `refreshTrigger`, the input `ListView`'s fetch already follows, and keys the list on the object and view alone.
- `@object-ui/plugin-view`: kanban, calendar, gallery, timeline, map and tree views keep their instance across a write and receive the refetched rows.

Views whose renderer fetches for itself and reads no refresh input are still remounted after a write, because that remount is the only way they show it: gantt and chart views in both layers, any object-page list whose visualization whitelist offers gantt or chart, and the standalone grid `plugin-view` renders when no host list view is supplied.
