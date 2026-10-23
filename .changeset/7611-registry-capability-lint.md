---
'@object-ui/app-shell': patch
---

Publish from Home no longer reports a `defineCapability` declaration as a capability that resolves nowhere (objectui#7611).

The advisory capability-reference lint that runs over pending drafts before **Publish** handed `@objectstack/lint`'s `validateCapabilityReferences` the drafts and the permission sets only, so a capability a package declares with `defineCapability` and no permission set grants yet was flagged on every object, field, action or app draft that required it. The lint now also reads the capabilities the registry serves (`GET /api/v1/meta/capability`) into the rule's `capabilities` source. A misspelled capability is still reported. If that read fails, the lint runs on the other sources as before and never blocks publishing.

Internal, no behaviour change: `approverIdentity` drops a display-column entry for `sys_position`, which no approver binding has named since `position` became registry-bound.

Clause-②: no
Metadata-protocol: none
