---
'@object-ui/plugin-dashboard': patch
---

The props of the dashboard's read-only record drill drawer are declared as `DashboardRecordDetailDrawerProps` instead of `RecordDetailDrawerProps` (objectui#6349, batch 8). `@object-ui/plugin-detail` publishes `RecordDetailDrawerProps` for its own record drawer, which is a different, editable component. This package's entry does not export the dashboard drawer, so no import changes and the props are the same.

No runtime behaviour changes.
