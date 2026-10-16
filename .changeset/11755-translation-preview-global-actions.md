---
'@object-ui/app-shell': patch
---

The translation designer's preview names each global action by its translated label (objectui#11755).

`TranslationDataSchema` declares every `globalActions` entry as an action translation node (`label`, `description`, `confirmText`, and the rest), not a string. The preview treated the category as a flat string map and drew each value with `String(v)`, so every entry the spec accepts read as `NAME[object Object]`. The category's sample now shows the node's `label`, quoted as a flat string is. A node without a `label` shows its key count, as the other nested categories do.

The other categories render as before. Nothing is added to the package entry: no export, prop, type member or language-pack key.
