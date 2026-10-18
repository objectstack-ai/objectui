---
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

The "N eligible approver(s)" figure beside an approval's decision progress counts people, not slots (objectui#12781). The record page's approvals panel and the approval request page's decision panel used to count the request's `pending_approvers` slots. The approvals service keeps one slot per resolved approver entry, so a person who holds two of the node's positions was counted twice. On the stock showcase, the committee quorum showed "3 eligible approvers" beside a single "Dev Admin ×3" chip. Both panels now count the distinct principals in the slate as the server serves it. Nothing is resolved in the console, and the server's tally (`got` of `need`) is drawn exactly as before.

The Approval Center's request drawer applies the same count: its decision-progress line now reads the number of distinct approvers in the served slate, where it read the slot count.
