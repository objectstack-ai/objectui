---
'@object-ui/plugin-list': patch
---

`list-view` re-reads its rows when a `conditionalFormatting` rule, a row action def or a bulk action def adds a field its predicates read (objectui#10689).

The list puts each predicate operand of those three into `$select`, but its fetch effect did not re-run when any of them changed. So a rule added to a mounted list never had its field fetched, and the rule never matched. The effect now keys on the operand names by content, so an equal value in a new array, or a change the query cannot see such as a rule's colour, does not re-read.
