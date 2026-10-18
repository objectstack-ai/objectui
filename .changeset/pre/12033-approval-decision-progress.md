---
'@object-ui/app-shell': patch
---

The record approvals panel draws its decision-progress tally through one module-internal indicator, `DecisionProgressIndicator` (objectui#12033, part of objectui#2763). The tally is an approval request's `decision_progress` as the approval-service contract declares it: approvals of every approver on a `unanimous` node, approvals of the threshold on a `quorum` (M-of-N) node, and satisfied groups, with one badge per group, on a `per_group` countersign node. The panel renders the same markup as before and reads the same `approvalsInbox.*` copy rows.

The indicator is not exported from the package entry and is not registered as an SDUI component type; registering it is the approval detail page's step (objectui#2763 B1).
