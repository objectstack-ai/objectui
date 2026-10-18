---
'@object-ui/core': minor
'@object-ui/plugin-view': patch
'@object-ui/plugin-calendar': patch
'@object-ui/plugin-kanban': patch
'@object-ui/plugin-form': patch
---

Five write affordances that read no grant at all now read the affordance-to-grant
map, so a caller without the grant is no longer offered a write the server then
refuses (objectui#12082, the card's remainder).

- **`object-view`'s New** (the toolbar button of the SDUI `object-view` node)
  reads the `listNew` row, as the console's list pages already did: the
  object's policy, the effective API operation set and the caller's create
  grant, on top of the node's `showCreate` / `operations.create` toggles.
- **The calendar's quick-create** (an empty-day click, or a time-range drag in
  the week / day grid) reads the new `calendarQuickCreate` row, and
  **drag-to-reschedule** reads the new `calendarReschedule` row. A closed row
  withholds the handler the calendar grid draws the affordance from: no dialog
  on a day click, no range drag, no draggable event. A host-supplied
  `onDateClick` / `onEventDrop` is handed through unchanged.
- **The kanban card move** reads the new `kanbanCardMove` row. A closed row
  draws the cards as not movable and hands the board no mover, so no drop
  reaches the write.
- **A line-items panel's add and remove** (`record:line_items`) read the
  `relatedNew` and `relatedRowDelete` rows on the CHILD object, the same rows a
  related list reads for the same two writes. Add covers the Add button, the
  entry row and Duplicate; remove covers the per-row Remove.

With no permission provider mounted every one of them reads open, as before.

**Clause-②: yes (widening).** `AFFORDANCE_GRANTS`, exported from
`@object-ui/core`, gains three rows: `calendarQuickCreate` (create),
`calendarReschedule` (update) and `kanbanCardMove` (update), and with them the
`ConsoleAffordance` union that `resolveAffordance` accepts. Nothing is removed or
renamed. The other four packages change behaviour only.
