---
'@object-ui/auth': patch
---

The `@objectstack/*` pin moves from `915e940499` to objectstack `e649c2d91e`, the 18.1.0 release commit (objectstack#25606), past objectstack#25483 and objectstack#25564, which ship together in that release (objectui#13440).

`@object-ui/auth` now takes `ORG_ROLE_EXTERNAL` from `@objectstack/spec`'s `MEMBERSHIP_ROLE_EXTERNAL` instead of spelling the literal. The exported name and its value (`'external'`) are unchanged, and `ORG_ROLE_LABELS` is typed by `OrgRole` alone again. The published module now imports that constant, so it needs an `@objectstack/spec` that exports it (18.1.0 or later); the publish step floors the `@objectstack/*` ranges at the release that contains the pin. With that spec the invite dialog lists `external` among the roles it offers, as objectui#13427 described for a spec that lists the role.
