---
'@object-ui/app-shell': minor
---

The bell's Activity tab and the console home's activity card now read business activity only: the shared activity feed filters `sys_activity` by `object_name` to the objects the user's apps list (derived from the app list and the sidebar's member gates), in the query, so `$top` counts business rows. A `sys_user` sign-in stamp (`last_login_at` / `last_login_ip` only) is never shown, even when an app lists `sys_user`. The feed asks nothing until the app list has loaded, and an empty roster is an empty feed rather than an unfiltered one. Setup and audit surfaces read `sys_activity` unfiltered, as before.
