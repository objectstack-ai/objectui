---
'@object-ui/react': minor
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
---

A record whose `approval_status` reads `pending` no longer opens locked when the approvals read answered and found no request (objectui#12220).

A composition without the approvals service answers `GET /api/v1/approvals/requests?object=…&recordId=…` with `200 { "data": [] }` and enforces no lock: a `PATCH` to the record succeeds. The record page still showed "Locked for approval", disabled Edit and offered Recall, which had nothing to recall, because the page and the detail body's approval band fell back to the literal `approval_status` column whenever no pending request was found. Records that an app stamped `pending` with no request behind them stayed locked in the console.

- **The rule:** when the approvals read answers, the lock follows the open request. No pending request means no approval band, no lock and no Recall. The `approval_status` column stands in only while no read has answered: the route is absent (404 or 501), the read has not landed yet, or the first read failed. A record with an open request is unchanged, including a `lockRecord: false` node, which stays editable.
- **`@object-ui/react` adds** `resolveApprovalLock`, the one function the record page and the band both call, with its `ApprovalLockInput` and `ApprovalLockState` types. It also adds an optional `approvalReadAnswered` prop on `InlineEditProvider`, read back on `InlineEditContextValue`. A host sets it when its `locked` and `approvalPending` come from an approvals read that answered. Omitted, the band keeps the column fallback exactly as before.
- **`@object-ui/app-shell`:** the record page sets `approvalReadAnswered` from its approvals read.
- **`@object-ui/plugin-detail`:** the band decides through `resolveApprovalLock`.

Nothing is removed or renamed.
