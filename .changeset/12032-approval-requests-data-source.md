---
'@object-ui/core': patch
'@object-ui/console': patch
---

Approval requests can now be read by the standard list and record views, and `ApiDataSource.findOne` now rejects a refused or failed read instead of reporting the record as missing (objectui#12032, A1 of objectui#2763).

- **`ApiDataSource.findOne` resolves `null` only on a 404.** Every other failure (a 403, a 5xx, a transport error) now rejects, the way `ObjectStackAdapter.findOne` does. Before, any failure resolved `null`, so a record page over a `provider: 'api'` source showed a refused or failed read as "Record not found". It now shows "no access", or "could not load" with Retry (the record page states from objectui#11902).
- **A console data source for approval requests.** `apps/console/src/services/approvalRequestsDataSource.ts` routes reads of `sys_approval_request` to the approvals routes through `ApiDataSource`, and everything else to the console's own adapter. Each source serves one server-side scope: awaiting me, submitted by me, or all. Rows come back as the approvals service serves them, so `viewer` and (on a single read) `decision_progress` are fields a view can bind. On a list read, `$top`, `$skip` and `$search` become the route's `limit`, `offset` and `q`, and `$select` is dropped. Every other parameter, such as a filter, a sort or an expansion, is refused with an `UNSUPPORTED_QUERY_PARAM` error, so the list shows its error panel and never shows unfiltered rows. Nothing mounts the source yet; the approvals list and detail pages that will use it come later.

Nothing is added to any package entry: no export, prop, type member or language-pack key.

**Superseded in part (objectui#12045):** the console now mounts this source on the `sys_approval_request` record route, so the sentence above saying nothing mounts it no longer holds when both changes release together.
