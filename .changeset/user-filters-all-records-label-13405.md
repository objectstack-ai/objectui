---
'@object-ui/plugin-list': patch
'@object-ui/i18n': patch
---

fix(plugin-list): the synthetic "All records" tab of a tabs-mode user-filter bar (`showAllRecords`) now reads its label from the new `list.userFilters.allRecords` i18n key, filled in every shipped locale (zh: 全部记录), instead of a hard-coded English string (objectui#13405). The tab's `__all__` id and behaviour are unchanged.
