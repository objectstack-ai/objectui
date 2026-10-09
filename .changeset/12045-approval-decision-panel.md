---
'@object-ui/fields': minor
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
'@object-ui/console': patch
---

A pointer field draws the record it points at, the console reads an approval request's record page through the approvals routes, and the approval decision panel is built for the request page (objectui#12045, B1 of objectui#2763).

- **The approval decision panel (`@object-ui/app-shell`, module-internal).** One panel that draws the request's decision progress (`DecisionProgressIndicator`) above the request's own declared decision actions (`DeclaredActionsBar` at `record_section`, decided through `ActionParamDialog`). It reads the bound request and takes no authorable props; outside a `sys_approval_request` record page it renders nothing. After a decision it invalidates the request record and its timeline instead of remounting. It is not registered as a component type yet: the type `record:approval_decision` is proposed to the spec on objectstack-ai/objectstack#22472, and its registration lands with the spec row.
- **`referenceVia` pointer pairs (`@object-ui/fields`).** `resolveRecordPointer(field, row)` returns the record a `text` field declaring `referenceVia` points at on one row (`{ objectName, recordId }`, the new `RecordPointer` type), and `RECORD_POINTER_CARD_TYPE` is the registry key a resolved pair is drawn with. The package's default under that key draws the record id as text, as the field drew before.
- **The record details grid draws the pair (`@object-ui/plugin-detail`).** A field declaring `referenceVia` is resolved from the row and drawn with the pointer face; with `@object-ui/app-shell` loaded that face is the record preview card, so `sys_approval_request.record_id` and the other pointer fields show the record they point at. A pair whose row leaves either half blank draws the stored text.
- **The console's approval request page.** The console's record route for `sys_approval_request` mounts the record page over the routed approvals source, so the request carries the `viewer` block its declared actions gate on and the decision tally. The source now reads one request's `sys_approval_action` timeline from `GET /approvals/requests/:id/actions`, applying the read's `$orderby`, `$top` and `$skip` itself, dropping `$select` and `$expand`, and refusing any other parameter with `UNSUPPORTED_QUERY_PARAM`. On a request's own page the record view no longer asks for approvals opened on the request itself.

No language-pack key is added, and `CellRendererProps` is unchanged.
