---
'@object-ui/plugin-gantt': patch
---

The schedule-conflict and auto-schedule dialogs' task counts read the right noun form in every language at every count (objectui#11445): `gantt.conflict.body`, `gantt.autoScheduleDlg.body` and `gantt.autoScheduleDlg.skipped` are i18next count families, so German no longer reads `1 betroffene Vorgänge` and Russian reads `3 задачи`. The provider-less fallback reads a family's `_one` / `_other` row for a numeric `count`.
