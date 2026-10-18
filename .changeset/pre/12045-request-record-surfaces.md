---
'@object-ui/console': patch
---

An approval request reads the same way on every console surface that opens it, and the Timeline tab of its served page shows its count (objectui#12045, the page-mount step of B1 in objectui#2763).

- **One layer for every surface.** The console's `AppContent` wraps the shell's content in `ApprovalRecordReads`, which hands every surface below it the console's adapter with two reads routed: a `findOne` of `sys_approval_request` reads `GET /approvals/requests/:id` (with the `viewer` block and the decision tally), and one request's `sys_approval_action` timeline reads `GET /approvals/requests/:id/actions`. That covers the record route, an `ObjectView` drawer or split overlay, and the record views embedded in the object data page and in an interface list page. A list of requests, and every other read, stay on the data API. The console's own `sys_approval_request` record route is retired: the generic record route reads through this layer.
- **The timeline's count and its label read.** A timeline read now honours `$count`, so the Timeline tab of the page objectstack serves for a request shows how many actions it has. The timeline's label read of its `request_id` column now reaches the data API instead of being refused by the approvals list.

No language-pack key is added, and no `@object-ui/*` export, prop or option changes.
