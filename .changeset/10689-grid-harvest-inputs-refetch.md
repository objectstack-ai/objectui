---
'@object-ui/plugin-grid': patch
---

`object-grid` re-reads its rows when an input its query reads changes: a `conditionalFormatting` rule, a row or bulk action def, or the view's `searchableFields` (objectui#10689).

The grid puts each predicate operand of its `conditionalFormatting` rules and its row and bulk action defs into `$select`, and sends `searchableFields` as `$searchFields` beside a search term, but its load effect did not re-run when any of them changed. So a rule added to a mounted grid never had its field fetched, and the rule never matched. The effect now keys on the operand names and on the `$searchFields` it sends, both by content, so an equal value in a new array, or a change the query cannot see such as a rule's colour, does not re-read.
