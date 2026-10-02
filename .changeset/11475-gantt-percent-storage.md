---
'@object-ui/plugin-gantt': patch
---

The gantt tooltip's `percent` row scales at the storage the field declares
(`percentCellScale`, the spec's `percentScaleOf`), the answer the list cell
reads. A fraction-stored `1` now reads `100%`, where the old magnitude guess
read `1%` (objectui#11475).
