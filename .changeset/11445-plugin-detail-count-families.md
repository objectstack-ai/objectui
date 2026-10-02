---
'@object-ui/plugin-detail': patch
---

The comment attachment count, the threaded-reply count and the reaction chip's accessible name read the right noun form in every language at every count (objectui#11445). Each passes `count` to one i18next count family instead of choosing between a `…Plural` / `…One` key on `=== 1`, which gave Russian `3 вложений` and Arabic `2 مرفقات`; they now read `3 вложения` and the Arabic dual. The relative timestamps (`detail.minutesAgo` and its two siblings) and the "Show N empty fields" toggle are count families too, so one empty field reads `Show 1 empty field`. The provider-less defaults table carries each family's `_one` / `_other` rows.
