---
'@object-ui/app-shell': patch
---

The search results line and the object view's record-count footer read the right noun form in every language at every count (objectui#11445). Each passes `count` to one i18next count family instead of choosing between a `…One` / `…Plural` key on `=== 1`, which gave Russian and Arabic only two forms: Russian now reads `2 результата` and `21 запись`, and Arabic uses its dual at 2.
