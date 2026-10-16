---
'@object-ui/core': patch
'@object-ui/plugin-detail': patch
'@object-ui/plugin-gantt': patch
'@object-ui/plugin-grid': patch
'@object-ui/plugin-form': patch
'@object-ui/app-shell': patch
---

More write affordances read the affordance-to-grant map, so a caller without the
grant is no longer offered a write the server then refuses (objectui#12082, leg A
of the write-census backlog). No row is added: each reuses the row of the same
verb on the same object.

- **The record overlay's inline edit** — the overlay the calendar, the kanban and
  the gantt open on a record (`RecordDetailPanel`) — reads the `recordEdit` row,
  the row the record page reads for the same in-place edit: the object's policy,
  the effective API operation set and the caller's update grant. A closed row
  opens no inline-edit session, as an absent `onFieldSave` already did. Each
  field still asks its own field question, as since objectui#12103.
- **The gantt's in-chart writes** read `rowEdit` (a bar's drag, resize and
  progress, its title edited in place, and its dependency links) and `rowDelete`
  (a row's Delete). A closed row withholds the handler the chart draws the
  affordance from, the way `readOnly` and `lockField` already do.
- **A grid's bulk field update** (a `bulkActionDefs` entry with `operation:
  'update'`) reads `rowEdit`, as its bulk delete reads `rowDelete`: a closed row
  removes the button from the selection bar, and with it the dialog, its undo
  and its retry. `custom` operations are unchanged.
- **A master-detail form's line grids** read `relatedNew` (Add, the entry row
  and Duplicate) and `relatedRowDelete` (Remove) on the CHILD object, as a
  line-items panel does. Remove asks the delete grant on an edit form only: a
  create form's lines are drafts, and a removed one is never a server delete.
- **A line-items panel** now hands its child object's schema to those two rows,
  so the child's own policy (`managedBy`, `userActions`) is read too.
- **The AI build panel's spreadsheet import** (`ExcelImportBar`) reads the
  `listImport` row of the object it imports into, as the list page's Import
  does: without it, Import is disabled for that object.

With no permission provider mounted every one of these reads open, as before.
