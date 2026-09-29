---
'@object-ui/plugin-dashboard': patch
---

`DashboardGridLayout` and `DashboardRenderer` now share one auto-refresh timer
(objectui#8820).

Each surface used to carry its own copy of the auto-refresh logic: the
refreshing indicator, the handler behind the "Refresh All" button, and the
interval that reads `refreshIntervalSeconds`. The two copies were identical in
logic. They are now one internal hook, `useDashboardAutoRefresh`, that both
surfaces call, so the authored period is read in one place.

Behaviour is unchanged. The timer runs only when the host passes `onRefresh`
and `refreshIntervalSeconds` is greater than zero; it is cleared when the
dashboard unmounts and re-armed when the period changes.

A new test mounts both surfaces and counts `onRefresh` calls under fake timers,
so a timer that stops firing on either surface fails a test.
