---
'@object-ui/core': minor
---

New export `recordDelete` — the one record-delete core that list hosts bind to, so a Delete behaves the same wherever it is offered (objectui#10383).

`recordDelete.confirmText({ objectName, t }, record?)` returns the question to ask before deleting one record. `recordDelete.run(deps, request)` performs the delete and reports it: one record, or several deleted one call each and settled together, then a refresh and the success, failure or "N deleted, M failed" toast. `deps` carries the host's `objectName`, `label`, `t`, `toast`, `dataSource` and optional `onRefresh`, so `@object-ui/core` takes no i18n or toast dependency. `request` is the action runner's `delete` shape (`params.records`, or `params.recordId` with an optional `params.record`), and the result is what a runner `delete` handler returns: the toasts are the feedback, so no path returns an `error` except a request with no record id.

ADR-0094 lives here: a `sys_permission_set` row whose `managed_by` is `'package'` is reset to its shipped baseline, not removed, so it is asked the reset question and gets the reset toast. The row passed in is read first, with a best-effort `findOne` when only the id is known.

The console's object list (`@object-ui/app-shell` `useObjectActions`) and the registered `object-view` grid (`@object-ui/plugin-view`) both call it. The console's behaviour is unchanged: its handler code moved here with no behaviour change, including the returns that keep the runner from showing a second toast.
