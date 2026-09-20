---
'@object-ui/core': minor
'@object-ui/fields': patch
'@object-ui/plugin-detail': patch
'@object-ui/plugin-list': patch
'@object-ui/plugin-kanban': patch
---

Add `isEmptyValue` to `@object-ui/core` — the weakest common claim about "is
this value empty": `null`, `undefined`, the empty string, the empty array, and
never a fifth member (objectui#8496, director seat, decision batch #86).

Five surfaces had each grown their own copy of those four members, and
objectui#8481 was the third rediscovery of the same hole. They now call the
shared floor and state their own answer against it: `record:details`'
`hasCellValue` and `RelatedList` extend it with a trim, `BooleanCellRenderer`
with every non-boolean, the date cells with every falsy scalar; `JsonCellRenderer`
declines its `[]` member out loud (the array literal is drawn on purpose) and
`FileCellRenderer` states "0 files" instead.

Two visible fixes come with it: a gallery card and a kanban card holding an
empty array in a card field now OMIT that field, as they already did for `null`,
instead of drawing a labelled "No value" em-dash for it.
