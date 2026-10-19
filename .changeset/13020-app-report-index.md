---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

Every app now has a report index at `/apps/APP/reports` (objectui#13020). It lists the reports the app's package ships, by their localized labels, each linking to its `report/NAME` page, and leaves out a report whose dataset reads an object the viewer may not read. The sidebar links it from every app as "All reports", with nothing for the app to author, and it shows an empty state when there are none.

The command palette (⌘K) now also finds those reports, by label and machine name, under the same read rule. A report the app's navigation names is still offered through its navigation entry, once.

New strings in every shipped locale: `sidebar.allReports` and `console.reportIndex.*`.
