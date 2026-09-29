---
'@object-ui/app-shell': patch
---

The console now honours a dashboard's authored `refreshIntervalSeconds` (objectui#11062). `DashboardView` used to render `DashboardRenderer` with no `onRefresh`, and the renderer's auto-refresh timer only runs when its host wires one, so a period set in Studio did nothing.

`DashboardView` now passes a refresh handler. It declares an unscoped change on the data-invalidation bus (`notifyDataChanged({ objectName: '*' })`), and the dashboard's widgets re-read their data in place through the subscription they already hold, so nothing is remounted. The timer is still the renderer's own: with a period of 60, the widgets re-read once every 60 seconds; `0`, a negative value or no value means no timer, and leaving the dashboard stops it.

Wiring the handler also turns on the renderer's manual refresh button on every console dashboard, whether or not it sets a period. It is a small outlined "Refresh All" button with a refresh icon, right-aligned in its own row at the top of the widget grid, below any header actions and the filter bar. A click re-reads the widgets once. For 600 ms after each refresh, manual or timed, it reads "Refreshing…", its icon spins and it is disabled. Its labels are not localized yet.
