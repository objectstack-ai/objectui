---
'@object-ui/plugin-detail': patch
---

**The record header's highlight chips share the row's free width and truncate only when it runs out (objectui#11684).** A Product with SKU "QA Widget 1" read "QA Wid…" in the record drawer's highlight row, with most of the row empty. Every chip in `HeaderHighlight` was a fixed column: a 9rem basis (16rem for wide types and for a column being edited), no grow, and a 16rem / 24rem cap. A value wider than the chip was clipped, however much room the row had left.

A chip's basis is now its floor, and the chips grow into the line's free width. Each chip is capped at its own content, so a chip that fits stops growing and the rest of the free width goes to the chips that still need it. Which chips share a line does not change, because line breaking still reads the floors. A short value keeps its 9rem column, and a sparse strip still packs left, because no chip is ever wider than what it shows. A value is cut with an ellipsis only once its line has no free width left. The whole value stays available as the hover title. A column being edited still takes the 16rem floor, and it can grow to its editor's natural width.
