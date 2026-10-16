---
'@object-ui/plugin-grid': minor
'@object-ui/i18n': minor
'@object-ui/console': minor
'@object-ui/fields': patch
---

List grids show the record a pointer field names, and the Approvals Inbox says who else is waiting (objectui#12608).

- **Record names in place of record ids.** A `text` field that declares `referenceVia` holds the id of a record whose object the sibling column names on the same row, as `record_id` does on Approval Requests (`referenceVia: 'object_name'`) or `source_id` on activities. In a list grid such a column now shows the target object's icon and the record's name, linking to the record. The record id moves to the tooltip. The grid reads the records of one page with one request per target object, not one per row.
- **Unavailable records say so.** When the record cannot be read (deleted, or outside what the viewer may read), the cell shows the object's label followed by "record unavailable", with the id in the tooltip, instead of the bare id.
- **The empty Approvals Inbox names who else is waiting.** When nothing is waiting on the viewer but other requests are pending, the empty state adds one muted line: "N requests are waiting on other approvers · Browse all requests". The number comes from one count request and counts only requests the viewer can see; when it cannot be read, the line is not shown.

New language-pack keys, in every shipped language: `grid.recordUnavailable` and the `approvalsInbox.waitingOnOthers` plural family.
