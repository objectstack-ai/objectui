---
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
---

Opening a record page sends one approvals read and one record read (objectui#12701).

- **Approvals.** Every section of a record page that shows its approval state (the lock band, the decision actions, the approvals panel or an authored `record:approvals` block) now shares one `GET /api/v1/approvals/requests?object=…&recordId=…` read. A section that mounts later, such as a tab opened after the page loaded, reads nothing and shows the same answer. In development, where the console runs under React StrictMode, a record open used to send this read three times. A decision, or a saved edit, still re-reads it for every section. Opening the record again reads it again.
- **The record.** The `record:details` body no longer reads its record a second time while the page's own read is in flight. It waits for the page's record, which already carries every relation the page expands, and shows its loading state until it arrives. `DetailView` takes a new `recordFromHost` prop for this. Without the prop, `DetailView` still reads its record itself.

Every section shows what it showed before.
