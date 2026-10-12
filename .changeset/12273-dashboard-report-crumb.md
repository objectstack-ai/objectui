---
'@object-ui/app-shell': patch
'@object-ui/i18n': minor
---

A dashboard or report route's breadcrumb no longer carries a 「Dashboards」 or 「Reports」 crumb (objectui#12273, applying the maintainer's ruling on objectstack-ai/cloud#2768, as objectui#12198 did for pages). **BREAKING** for `@object-ui/i18n`: the pack keys `console.breadcrumb.dashboards` and `console.breadcrumb.reports` are retired from all ten language packs, with no replacement.

- **`@object-ui/app-shell`.** On `/apps/APP/dashboard/NAME` the top bar's trail used to read app › Dashboards › dashboard, and on `/apps/APP/report/NAME` app › Reports › report. Each type crumb named a metadata type, not a place the user went, and its link only reopened the app's base, which the app pill already does. The trail now goes from the app pill straight to the dashboard or report, as it does for a page. System and object routes draw their trails as before.
- **`@object-ui/i18n`.** `console.breadcrumb.dashboards` and `console.breadcrumb.reports` each had one reader, the crumb above, and are removed from the `en`, `zh`, `ja`, `ko`, `de`, `fr`, `es`, `pt`, `ru` and `ar` packs. A host that looked either key up through the published packs now gets the key string back, and has nothing to read instead: no screen draws a type crumb ahead of a dashboard or report any more. The other `console.breadcrumb.*` keys are unchanged.

**Clause-②: no (narrowing).** Two published pack keys are removed; nothing is added and no accepted input widens.
