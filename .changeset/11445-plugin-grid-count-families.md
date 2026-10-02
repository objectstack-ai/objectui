---
'@object-ui/plugin-grid': patch
---

The import wizard's counts read the right noun form in every language at every count (objectui#11445): the auto-match summary, the rows-with-errors and rows-corrected lines, the result counts and the Import button are i18next count families, so Russian reads `Импортировать 3 строки` and English `Import 1 Row`. The auto-match summary passes its count as a number — i18next does not plural-select a string. The wizard's provider-less fallback reads a family's `_one` / `_other` row for a numeric `count`.
