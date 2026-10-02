---
'@object-ui/components': patch
---

The data table's "N rows modified" line and the `page:tabs` count badge's accessible name read the right noun form in every language at every count (objectui#11445): both are i18next count families now, so English no longer reads `3 row modified` and Russian reads `2 элемента` rather than a count label. The tab badge passes its number as `count` below 1000; a shortened `1.2k` is passed as the string the badge shows, which i18next does not plural-select, so the base key — count-invariant in every pack — answers it.
