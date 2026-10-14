---
'@object-ui/plugin-report': patch
'@object-ui/i18n': minor
---

A report the viewer may not read shows the no-access state, not the server's refusal (objectui#12330).

When the dataset query behind a report was refused because the viewer may not read its object (403 `PERMISSION_DENIED`), the report page drew a red error box with the adapter's message: "Analytics query refused: … (server said: [Analytics] Access denied: reading "…" is not permitted for this user.)". That text quotes the server and names the object. A dashboard widget refused the same way already showed a localized "You don't have access" state.

- **The refusal is classified once, in the report's dataset read**, by the shared `classifyLoadError` from `@object-ui/react`, the branch `DatasetWidget` takes for the same refusal. It judges the refusal by status and code, as `DatasetWidget` does; this renderer never matches the adapter's refusal text.
- **A refused report shows "You don't have access"** (the widget's title, `dashboard.widgetForbiddenTitle`) and "You don't have permission to view the data behind this report." (the new `report.forbiddenMessage`, in all ten language packs). The table, the summary and the cross-tab show it, and so does each joined block. No server text and no object name is drawn.
- **A report with a chart shows it once.** The chart already hides itself when its own query fails, and the table beside it shows the state.
- **Any other failure keeps its error box and message**, so a real error (a 500, a rejected query) is not hidden behind "no access".

**Clause-②: yes (widening)**: one locale key, `report.forbiddenMessage`, added to `@object-ui/i18n`'s published packs, which widens `TranslationKeys`. No export, prop or schema key is added, and nothing is renamed or removed.
