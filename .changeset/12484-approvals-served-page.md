---
'@object-ui/console': patch
---

The Approvals Inbox opens a request on the page the platform serves for it, and its side sheet is gone (objectui#12484).

A row, a mobile card, Enter on the focused row, and a notification's `?request=` deep link now open the request's record page: the `sys_approval_request_detail` page `@objectstack/plugin-approvals` serves, on the console's standard record route. That page shows the request's title (the flow's label), its decision panel (the declared amount and snapshot summary, the approvers, the step line and the decisions), its highlights, its target record, and its timeline. The deep link takes its own place in the browser history, so Back returns to where the reader came from; from a row, Back returns to the inbox.

The inbox's own request sheet is deleted. Its quick paths stay: inline approve and reject, bulk decisions, filters, sorting and keyboard navigation.
