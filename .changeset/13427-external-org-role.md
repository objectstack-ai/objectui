---
'@object-ui/auth': minor
'@object-ui/i18n': patch
---

The console knows the `external` organization role that objectstack#25515 added to `@objectstack/spec`'s membership vocabulary (objectui#13427). Without it `ORG_ROLE_LABELS` no longer type-checked against an `@objectstack/spec` that lists the role.

`@object-ui/auth` exports `ORG_ROLE_EXTERNAL` and labels it (`organization.roles.external`, "External"). Every pack in `@object-ui/i18n` carries the key; zh reads 外部成员, as the server's own `sys_member.role` option does. Wherever the installed spec lists the role, the invite dialog offers it to every issuer who can invite, a delegated admin included, because objectstack's invitation cap admits it from any issuer: it confers less than a member. Owners and admins can also set it from the members page. On the grade ladder it sits with `member`, as it does in objectstack's cap, so it never unlocks an administrative affordance.
