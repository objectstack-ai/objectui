---
'@object-ui/plugin-kanban': patch
'@object-ui/app-shell': patch
---

The `object-kanban` board totals the view's `summarizeField` in each column header (objectui#11629).

`@objectstack/spec` declares `summarizeField` on the view-level `KanbanConfig` ("Field to sum at top of column"), and `ListView`'s kanban branch passes it onto the `object-kanban` node it generates. The board never read it, so a view that set it showed the card count and no total. Each column header now shows the sum of that field over the column's cards, beside the count, on both the flat layout and the swimlane layout's column-title row.

- The total is written by the field's own cell renderer, the one the cards use for that field. A currency field totals as currency, and a number field keeps its declared `scale`. A sum over a number field with no declared `scale` is rounded to the widest input, so `0.1 + 0.2` reads `0.3`.
- An absent, `null` or empty value counts as `0`, and an empty column totals `0`. A numeric string counts as the number the card shows for it. A column holding any other value shows no total, never `NaN`.
- The total covers the cards the board loaded. When the board's own fetch filled its window, the total carries the same `+` the count carries (`6+`).
- No total is shown for a field the viewer may not read, or a field the object does not declare. The rows never carry such a field, so the column would read `0`.
- A `Σ` glyph sets the total apart from the count badge beside it. The field's label is the total's tooltip and its screen-reader name, and the glyph is hidden from assistive technology. No translation key is added.

A board whose node carries no `summarizeField` renders exactly as before. The console's object page now passes a view's `summarizeField` on to the list view with the lane, title and card fields it already relayed, so a board opened there shows the totals (until now the key was dropped on that page). Nothing is added to the package entry: the total reaches the header through a package-private context, the same channel the records-settled signal uses.
