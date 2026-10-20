---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

An admin overriding an approval REASSIGN is now told what a reassign does (objectui#13164). The approvals action bar gave every override lever the decision sentence — "it finalises the step immediately and bypasses the approvers who have not acted" — so the Override Reassign dialog promised a finalised step while the server leaves the request pending on the new approver. A reassign override now reads that the step moves to the new approver you pick, replacing the approvers who have not acted (named when known), that the request stays pending and waits on the new approver, and that the reassignment is recorded as an admin override. The lever is read off the declared action's `target` route, the same reading the bar already makes for decision outputs. Approve and reject overrides keep their sentence unchanged.

All ten language packs gain `approvalsInbox.overrideReassignNotice` and `approvalsInbox.overrideReassignNoticeWho`. No existing key or value changes.

Clause-②: yes

The new keys widen the exported `TranslationKeys`. Nothing narrows.
