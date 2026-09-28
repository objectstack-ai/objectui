---
'@object-ui/data-objectstack': patch
'@object-ui/plugin-dashboard': patch
'@object-ui/i18n': patch
---

fix(data-objectstack, plugin-dashboard): a dataset tile the viewer may not read shows a localized "no access" state (objectui#10899)

When the analytics read admission refused a dashboard dataset query — `403`
with ADR-0112 `PERMISSION_DENIED` — `queryDataset` had no branch for that code,
so it threw the generic `Dataset query failed: 403 Forbidden — [Analytics]
Access denied: …` string, and `DatasetWidget` printed it verbatim in a red
alert. The list view over the same object already says 「无权访问」.

- `queryDataset` now throws a typed `AnalyticsForbiddenError` for that code,
  carrying `httpStatus: 403` and `code: 'PERMISSION_DENIED'` (plus the server's
  code and message for diagnostics). A code-less 403 — no ObjectStack route
  wrote it — keeps the generic error.
- `DatasetWidget` classifies a failed query with the shared `classifyLoadError`
  and, for `forbidden`, renders a localized no-access state
  (`dashboard.widgetForbiddenTitle` / `dashboard.widgetForbiddenMessage`, new in
  all ten packs) instead of the exception text. Every other failure keeps the
  detailed alert.
