---
'@object-ui/fields': minor
'@object-ui/app-shell': minor
'@object-ui/plugin-detail': patch
'@object-ui/cli': patch
'@object-ui/console': patch
---

An approval request's record page gets its decision panel, a pointer field draws the record it points at, and the console reads every approval request page through the approvals routes (objectui#12045, B1 of objectui#2763).

- **`record:approval_decision`, a new page component type.** One panel that draws the request's decision progress (`DecisionProgressIndicator`) above the request's own declared decision actions (`DeclaredActionsBar` at `record_section`, decided through `ActionParamDialog`). It reads the bound request and takes no authorable props; outside a `sys_approval_request` record page it renders nothing. After a decision it invalidates the request record and its timeline instead of remounting. The spec row for the type is proposed on objectstack-ai/objectstack#22472.
- **`referenceVia` pointer pairs (`@object-ui/fields`).** `resolveRecordPointer(field, row)` returns the record a `text` field declaring `referenceVia` points at on one row (`{ objectName, recordId }`, the new `RecordPointer` type), and `RECORD_POINTER_CARD_TYPE` is the registry key a resolved pair is drawn with. The package's default under that key draws the record id as text, as the field drew before.
- **The record details grid draws the pair (`@object-ui/plugin-detail`).** A field declaring `referenceVia` is resolved from the row and drawn with the pointer face; with `@object-ui/app-shell` loaded that face is the record preview card, so `sys_approval_request.record_id` and the other pointer fields show the record they point at. A pair whose row leaves either half blank draws the stored text.
- **The console's approval request page.** Every `sys_approval_request` record page is mounted over the routed approvals source, so the request carries the `viewer` block and decision tally its actions and panel read. The source now reads one request's `sys_approval_action` timeline from `GET /approvals/requests/:id/actions`, applying the read's `$orderby`, `$top` and `$skip` itself, dropping `$select` and `$expand`, and refusing any other parameter with `UNSUPPORTED_QUERY_PARAM`. On a request's own page the record view no longer asks for approvals opened on the request itself.
- **`objectui check`** knows `record:approval_decision` as a registered type.

No language-pack key is added, and `CellRendererProps` is unchanged.
