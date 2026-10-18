---
'@object-ui/components': patch
---

The data table's header cells name their column: each carries `data-column-key` with the column's `accessorKey` (objectui#12725). Studio's canvas reads it to tell which column a header click names; nothing else in the header carried the key on every column. Markup only: no prop, export or behaviour changes, and a header click still sorts.

Clause-②: no. An additive `data-*` attribute; no prop, export or language-pack key changes.
