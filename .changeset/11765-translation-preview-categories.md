---
'@object-ui/app-shell': patch
---

The translation designer's preview draws the groups of the schema it validates a bundle against (objectui#11765).

The designer judges a translation draft by the per-app `TranslationDataSchema` groups, but the preview drew a hand-kept list that had drifted from them. It left out `picklists`, `datasets`, `pages`, `flows` and `settingsCommon`, so a spec-valid bundle of only one of those groups read as empty. It also listed `validationMessages`, which the spec removed, and `settings`, which only the platform schema declares. Both counted toward the coverage denominator, so a spec-valid bundle could never reach full coverage.

The preview now draws one card per schema group, in the schema's order, and divides coverage by that count. A key the schema refuses is not drawn and not counted. A nested entry of a single key now reads `{1 key}` rather than `{1 keys}`.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new headings are rows of the designer's own string table.
