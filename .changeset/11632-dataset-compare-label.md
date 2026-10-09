---
'@object-ui/plugin-dashboard': patch
---

A dataset-bound dashboard widget names its comparison window from `compareTo.kind` (objectui#11632). `previousPeriod` reads "vs previous period" and `previousYear` reads "vs last year", in every locale the `dashboard.trend.*` keys already cover. The label used to be guessed from the widget filter's date-macro tokens. A dashboard date range of `last_30_days` (`{30_days_ago}` to `{today}`) with `compareTo: { kind: 'previousPeriod' }` therefore read "vs yesterday", although the analytics executor had compared the previous 30 days. A quarter's macros read "vs last quarter" in the same way, although the executor compares the equal-length window before the quarter. The fix applies to every place the widget names the window: the KPI delta, the table's comparison column header and its CSV export, the cross-tab caption, and the chart's comparison series. The compared values were already right and do not change.

Inline (non-dataset) metric and chart widgets keep their filter-based label. There the comparison filter really does swap `{today}` for `{yesterday}` and `current_*` tokens for `last_*`, so the label matches what was compared.

**Clause-②: no.** No export, prop, type member or i18n key is added or removed.
