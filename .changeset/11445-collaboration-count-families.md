---
'@object-ui/collaboration': patch
---

The comment thread's header, its reaction tooltip and the presence stack's labels read the right noun form in every language at every count (objectui#11445). Each passes `count` to one i18next count family as a number — not a string, which i18next does not plural-select — instead of choosing between a `…CountOne` key and its pair on `=== 1`. The relative comment timestamps pass a number too, so Arabic reads `قبل 5 دقائق` rather than `قبل 5 دقيقة`. `COLLAB_DEFAULT_TRANSLATIONS` carries each family's `_one` / `_other` rows, mirroring the `en` pack.
