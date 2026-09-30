---
'@object-ui/console': patch
---

Retire the system hub card wall. `/apps/:app/system` now forwards onto the
settings hub at `/apps/:app/system/settings` instead of rendering a
hand-written page of cards (objectui#3743).

The hub kept its own copy of the admin navigation: a card array, per-card count
queries and badge text that each needed a manual update whenever the object or
permission model changed. The page (`SystemHubPage`) and its two test suites
are deleted.

Every link that used to open the hub and still ships now lands on the settings
hub: the sidebar's "System Settings" entry, the "System Settings" button on the
"No Apps Configured" screen, the home Quick Action and the legacy `/system`
bookmark. The Setup app's navigation ("All Settings") and the sidebar's
"Configuration" entry already declare that page. It lists the settings
manifests the server returns for the signed-in user. The landing works with no
apps configured as well.

The `/apps/:app/system/{users,organizations,roles,positions,permissions}`
redirects are unchanged.
