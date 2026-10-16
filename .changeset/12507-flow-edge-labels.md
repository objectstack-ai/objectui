---
'@object-ui/app-shell': patch
---

Flow canvas: a branch edge's pill reads the edge's own label first, so two outcomes of one decision no longer show the same truncated condition (objectui#12507).

- An edge with a `label` shows it; an edge without one shows `if ` and its condition; a default edge still reads `else`. The pill text is one line of at most 32 characters, then an ellipsis.
- Hovering the pill shows the full wording: the edge's label and its whole condition, one per line. The edge inspector still edits the condition.
- The pill may grow to the width of a node card, but never so wide that it reaches the pill of a sibling edge. The insert-node handle in the designer moves to sit just past the pill.
