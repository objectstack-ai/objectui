---
'@object-ui/core': minor
'@object-ui/app-shell': minor
---

A page predicate can ask the capability question: `current_user.hasCapability('NAME')` now answers in the console, from the same `/auth/me/permissions` answer the action gate reads (objectui#13006, the objectui half of objectstack#24414).

- **`@object-ui/core`** carries the subject's held system capabilities to the formula engine the way it already carries the object-permission map for `current_user.can(object, verb)`. New `bindSubjectCapabilities` / `subjectCapabilitiesOf` sit beside `bindSubjectPermissions` / `subjectPermissionsOf`, under a symbol key (`SUBJECT_CAPABILITIES`), and `evalFieldPredicate` passes the list as `EvalContext.systemPermissions`. The list is not a CEL root and not a readable member of `current_user`.
- **`@object-ui/app-shell`**'s `ExpressionProvider` binds that list from `usePermissions().systemPermissions` once the payload has loaded. Until then nothing is bound and the call faults, the same as `can()` does: it is never defaulted to `[]`. An empty list is a real answer and evaluates to `false`. The list is bound only together with the object-permission map from the same answer, so both change at the same time.
- Actions' `visible`, the action capability gate (`requiredPermissions`) and every other existing gate are unchanged.
