---
'@object-ui/plugin-kanban': minor
'@object-ui/plugin-list': minor
'@object-ui/i18n': patch
---

A kanban under a list view puts every record of the view in its column, not the list's first page, and its cards carry the view's first columns (objectui#12619).

Measured on HotCRM's 45 opportunities at Display › Layout › Kanban: the board drew 25 cards (the grid's Rows per page), the closed columns read 0, the footer read "Showing first 25 records. More data may be available.", and each card showed only the record's name.

- **Each lane is its own query.** `ListView` no longer hands its board the rows it fetched for the grid. It hands it the view's query, and the board asks each lane for its first 50 records: the view's filter (toolbar filters and chips included) AND the lane value, in the view's sort, with the toolbar search. The lane's count in its header is the server's count from the same answer. A lane holding more shows **Load more** at its foot. One more query finds the records in no lane (a lane value that is none of the lanes, or empty) for the trailing Uncategorized lane. A refresh asks each lane again at the depth it was loaded to. Dragging a card between columns writes the lane value and asks for the required fields as before, and both lane counts follow the card.
- **The list footer counts the view.** It shows the view's record count from the list's own query, with no "Showing first N records" line and no Rows per page picker on such a board.
- **Which boards page their lanes.** A board whose lanes are known before the query (the lane field's options) and that draws no swimlanes. Any other board under a list view is handed the list's rows, as before. A standalone `object-kanban` keeps its one query, capped by `limit`.
- **Cards carry the view's first columns.** With no `kanban.columns` of its own, a list view hands the board the view's next two columns past the card title, the lane field and the owner field, by field name. Before, a card drew no field lines from the view's columns. Below its name it showed at most a subtitle the board derives from the record where the record yields one (an amount and an account, say). On HotCRM's measured board it showed the name alone: that view's columns are `{ field }` entries, handed over whole, which the card read as field names and matched none. The kanban block's `columns` is the author's card list and is used whole.
- **A card field is a line with its label.** Each card field now shows its label, muted, before its value. The label used to be a tooltip only. The card's reduced padding between its title and its first field line now holds at every breakpoint; from the `sm` breakpoint up it had widened back to the full padding.
- **The owner's avatar.** When the object gives its records an owner (the spec's `ownership` model and `SystemFieldName.OWNER_ID`, read through `resolveInjectedSystemColumns`), each card shows the owner's avatar from the expanded owner record, as the viewer may read it.

Public surface: `ObjectKanbanComponentProps` gains two optional host props, `lanePaging` (`{ search?, searchFields?, reloadKey? }`) and `ownerField`. Neither is an authoring key on the `object-kanban` node. `@object-ui/i18n` gains `kanban.loadMore` in every language pack.
