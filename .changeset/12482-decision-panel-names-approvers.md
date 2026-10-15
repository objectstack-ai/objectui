---
'@object-ui/app-shell': minor
---

The approval decision panel (`record:approval_decision`) names who a pending request waits on (objectui#12482, folding objectui#12077). Each pending approver is one chip under "Waiting on": the server's own name for a user id, a position's registry label (with the people who hold it) for a `position:` slot the server left unnamed, and the countersign group the slot fills. One person holding several quorum slots is one chip with a count; two people sharing a name in two groups stay two chips. An id nothing can name keeps the identity formatter's middle-truncated face, and every raw slot stays on hover only. So the request page objectstack serves now shows the approvers the approvals inbox's sheet shows, with no page, prop or spec change: the panel reads the request row it is already bound to.
