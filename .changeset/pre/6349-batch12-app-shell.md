---
'@object-ui/app-shell': patch
---

The list view's URL filter state reads the FilterBuilder's group by `@object-ui/components`' new name for it, `FilterBuilderRowGroup` (it was exported as `FilterGroup`; objectui#6349, batch 12). The type is the same. The package entry's exported names are unchanged, and nothing you import from `@object-ui/app-shell` changes shape.

No runtime behaviour changes.
