---
'@object-ui/plugin-list': patch
---

`ListViewProps.onFilterChange` and `ListViewProps.initialFilters` now name the advanced-filter group by `@object-ui/components`' new name for it, `FilterBuilderRowGroup` (it was exported as `FilterGroup`; objectui#6349, batch 12). The type is the same. Nothing you pass or receive changes shape, and the package entry's exported names are unchanged.

No runtime behaviour changes.
