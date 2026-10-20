---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

The approvals Recall button no longer calls a submitter's own recall an override, and an admin recalling someone else's request is told what a recall does (objectui#13225). `approval_recall` ORs in the admin-override arm alongside its submitter arm, so the action bar labelled it "Override Recall" for every override-capable viewer, the submitter included, and gave it the decision sentence: "it finalises the step immediately … The decision is recorded as an admin override." The server does neither on a recall: it withdraws the request, clears its pending approvers, and writes a `recall` action row with no override marker.

- A submitter, admin or not, now sees the plain Recall. `isOverrideDecision` no longer counts a lever as an override when the viewer holds it through its submitter arm (the served `is_submitter` flag, read for any lever whose declared gate names it).
- An admin who did not submit the request still sees "Override Recall", and its notice now says the request is withdrawn, the record is unlocked, and the approvers who have not acted can no longer act on it (named when known). It says nothing about finalising the step or an override record.
- Approve, reject and reassign overrides read exactly as before, and the request the bar sends is unchanged.

All ten language packs gain `approvalsInbox.overrideRecallNotice` and `approvalsInbox.overrideRecallNoticeWho`. No existing key or value changes.

Clause-②: yes

The new keys widen the exported `TranslationKeys`. Nothing narrows.
