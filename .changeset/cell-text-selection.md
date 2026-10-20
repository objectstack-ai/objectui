---
"@object-ui/components": patch
"@object-ui/plugin-grid": patch
---

data-table / VirtualGrid: selecting a cell's text no longer opens the record or starts an inline edit, and Ctrl/Cmd+C copies the selected text instead of the whole cell value. A plain click still opens or edits as before (objectui#13188).
