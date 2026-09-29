---
'@object-ui/app-shell': patch
---

The console now honours a dashboard's authored `refreshIntervalSeconds` (objectui#11062). `DashboardView` used to render `DashboardRenderer` with no `onRefresh`, and the renderer's auto-refresh timer only runs when its host wires one, so a period set in Studio did nothing.

`DashboardView` now passes a refresh handler. It declares an unscoped change on the data-invalidation bus (`notifyDataChanged({ objectName: '*' })`), and every widget that already listens on the bus re-reads its data in place, so nothing is remounted. The timer is still the renderer's own: with a period of 60, those widgets re-read once every 60 seconds; `0`, a negative value or no value means no timer, and leaving the dashboard stops it.

Not every widget listens yet. A dataset-bound widget subscribes on the base object its query's answer names, and the answer to a query with no dimensions names none, so a dataset-bound KPI tile does not refresh, on the timer or on the button.

Wiring the handler also turns on the renderer's manual refresh button on every console dashboard, whether or not it sets a period. It is a small outlined "Refresh All" button with a refresh icon, right-aligned in its own full-width row of the widget grid, below any header actions and the filter bar, so the widgets start one grid row lower than before. A click runs one refresh. For 600 ms after each refresh, manual or timed, it reads "Refreshing…", its icon spins and it is disabled. Its labels are not localized yet.
