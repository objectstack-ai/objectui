---
'@object-ui/plugin-dashboard': patch
---

One field key now renders under one spelling across a dashboard drill chain: the record drawer and the chart series label both derive their display string with `humanizeFieldKey`, the single home for the KEY convention (objectui#9055).

**The record drawer, on the same click.** `RecordDetailDrawer` built its field label from a fourth inline spelling that upper-cased only the FIRST word. `ObjectDataTable`'s drill list is drill-to-record by default and the record it opens is this drawer, so one click moved from a column headed `Close Date` to a field labelled `Close date` — same key, same widget, one uninterrupted interaction. Measured on the rendered DOM of one chain, before the fix: headers `Close Date · Needs Analysis · Unit Price · Amount` against drawer labels `Close date · Needs analysis · Unit Price · Amount`. camelCase agreed under both spellings, which is why it went unnoticed.

**The chart series label, on two of its three arms.** `resolveSeriesLabel` in `DashboardRenderer` handed back the RAW field key twice: as `fieldLabel`'s fallback on the object-bound arm, and outright on the arm every static-data chart takes. A chart grouped on `close_date` legended it `close_date` while the table widget beside it headed that column `Close Date`. The static-data arm is not named by the card; it is the same defect reached through the other call site, and it is fixed here rather than left for a follow-up. The synthetic-key arm — a count aggregation with no real field, which resolves an i18n'd aggregate name (Count / 计数) — is a different vocabulary and is deliberately untouched.

The i18n wrapper is unchanged everywhere: a bundle entry still wins and the derived spelling is only its fallback, and the `objectName` guards are as they were. No published export, schema key or registry entry moves. The KEY prefixer stays distinct from `humanizeLabel`, the VALUE prefixer in `@object-ui/core` — converging those two is a separate decision its own docblock already reserves for its own card.
