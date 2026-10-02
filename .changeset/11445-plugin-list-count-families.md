---
'@object-ui/plugin-list': patch
---

The list view's record-count bar reads the right noun form in every language at every count (objectui#11445): it passes `count` to the `list.recordCount` count family instead of choosing `list.recordCountOne` on `=== 1`, so Russian reads `2 записи` and Arabic uses its dual at 2. `LIST_DEFAULT_TRANSLATIONS` carries the family's `_one` / `_other` rows.
