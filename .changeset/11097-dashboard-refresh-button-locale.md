---
'@object-ui/plugin-dashboard': patch
'@object-ui/i18n': patch
---

The dashboard's refresh button now speaks the session language (objectui#11097). `DashboardRenderer` and `DashboardGridLayout` hard-coded "Refresh All", "Refreshing…" and the accessible name "Refresh dashboard", so a zh-CN session read English on the button that every console dashboard shows since the console began wiring `onRefresh`. Both components now read the pack keys `dashboard.refreshAll`, `dashboard.refreshDashboard` and the existing `dashboard.refreshing`. The English wording is unchanged.

`@object-ui/i18n`: new keys `dashboard.refreshAll` and `dashboard.refreshDashboard` in every built-in locale pack.
