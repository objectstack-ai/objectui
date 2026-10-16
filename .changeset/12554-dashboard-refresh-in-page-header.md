---
'@object-ui/plugin-dashboard': minor
'@object-ui/app-shell': minor
---

**A dashboard's "Refresh All" sits in the console page header** (objectui#12554). The console's dashboard page draws the button at the right of its page header's one row, among its actions. The renderer no longer draws a second one in its own row below the header.

**Clause-②: yes (widening).** `DashboardRenderer` gains one optional prop, `onRefreshStateChange`. Nothing else on the public surface changes.

- **`@object-ui/plugin-dashboard`.** Set `onRefreshStateChange` and the renderer draws no refresh button of its own. It calls the callback with `{ refreshing, handleRefresh }`: on mount, each time `refreshing` changes, and with `null` when no `onRefresh` is wired or the renderer unmounts. `handleRefresh` is the run the renderer's own button calls. The auto-refresh timer stays the renderer's: `onRefresh` still arms the authored `refreshIntervalSeconds`. The record-count badge stays where the renderer draws it. A host that leaves the prop unset gets the renderer's button, exactly as before.
- **`@object-ui/app-shell`.** `DashboardView` passes the prop and draws the button from the report, with the same three `dashboard.*` pack keys, icon, spin and disabled-while-refreshing as the renderer's own button. A click runs the renderer's refresh, so the button spins on manual and timed runs alike. When the dashboard declares a filter bar, the bar keeps its row; when it declares nothing else above its widgets, the row the button stood in is gone.
