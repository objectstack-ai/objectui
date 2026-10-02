---
'@object-ui/fields': patch
---

The record picker's record count reads the right noun form in every language at every count (objectui#11445): it passes `count` to the `lookup.recordCount` count family instead of choosing `lookup.recordCountOne` on `=== 1`, so Russian reads `2 записи` and Arabic uses its dual at 2. The provider-less defaults table carries the family's `_one` / `_other` rows.
