---
'@object-ui/plugin-ai': patch
---

The AI form assistant's suggestion and applied counts read the right noun form in every language at every count (objectui#11445): each passes `count` to one i18next count family instead of choosing a `…CountOne` key on `=== 1`, so Arabic reads `3 اقتراحات` rather than a count label and Russian `2 предложения`.
