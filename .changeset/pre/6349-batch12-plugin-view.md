---
'@object-ui/plugin-view': patch
---

`toFilterGroup` now declares its return type by `@object-ui/components`' new name for the FilterBuilder's group, `FilterBuilderRowGroup` (it was exported as `FilterGroup`; objectui#6349, batch 12). The type is the same. The function keeps its name, and what it returns is unchanged.

No runtime behaviour changes.
