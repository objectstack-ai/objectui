---
'@object-ui/app-shell': patch
---

The app's report index (`/apps/APP/reports`) and the ⌘K palette's report list now include the reports a module contributes to the app's navigation (`navigationContributions`), not only the reports the app's own package owns. The index lists the union of the app package's reports and every report a `type: 'report'` navigation entry names, deduplicated by name; an entry naming a report the server does not serve is left out, and the dataset read gate still hides a report the member may not read.
