---
'@object-ui/plugin-grid': patch
---

A `markdown`, `html` or `richtext` cell keeps the grid's one-line row (objectui#12480). The grid's one-line clamp bounded inline content only, so a long rich-content value (a multi-paragraph `description`) grew its whole row to the document's height and pushed the rows after it below the scroll box, while the footer still counted them. A rich-content column now shows the first line of its document; a column authored `wrap: true` still shows the whole document. Affects the Studio Data pillar's Records grid and the console list pages alike.
