---
'@object-ui/console': patch
---

The Approvals Inbox no longer links to a record when the approver has no read of its object at all (objectui#11878, ruling C on objectstack-ai/objectstack#7497). Such an approver is routed requests as usual, but the server refuses every read of the object with `403 PERMISSION_DENIED`. The inbox's readability probe read that refusal as "unknown" and kept the link, which landed on the record page's "Record not found — … may have been deleted".

The probe now reads a refused read (the `forbidden` kind of `classifyLoadError`: a 403, or the permission-denied envelope that comes with it) as "cannot read", exactly as it already reads an answer that leaves the record out of the approver's row set (objectui#5211). The record link is not rendered, on the row and in the request drawer. The refusal is about the object, not the record, so the missing link says nothing about whether the record exists.

Nothing else changes:

- **The request stays fully usable.** The row, the drawer with its snapshot, and approve and reject are unchanged, and the row still shows the record's title from the request's snapshot.
- **Every other failure still keeps the link.** A transport error, a 5xx, a 401, an object whose API is disabled, a probe that has not answered yet and a page with no data source all keep today's link, so a transient error never hides a link someone could use.
- **The cause-free label stays where it was.** "This record cannot be opened" (objectui#8631) still appears only for a title-less record the approver's row set leaves out. A refused title-less row keeps the reference text it showed before, now without the link.

**Clause-②: no.** No export, prop, type member, accepted input or i18n key of any package changes. The change is internal to the console's approvals page.
