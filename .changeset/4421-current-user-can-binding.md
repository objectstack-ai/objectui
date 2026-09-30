---
'@object-ui/core': minor
'@object-ui/permissions': minor
'@object-ui/app-shell': minor
---

feat: an action's `visible` / `disabled` predicate can ask `current_user.can(object, verb)` — the caller's object permissions, from the payload the built-in Edit / Delete buttons are already gated by

A custom action that replaces a built-in CRUD button — a logical delete that archives
instead of deleting, say — can now carry the same gate the built-in button had:

```yaml
visible: current_user.can('account', 'delete')
```

It answers from the signed-in user's `/auth/me/permissions` payload once that payload
has loaded, on the record header and the row menu alike. Until then it gives no answer:
the predicate faults, and a surface that evaluates `visible` fail-closed does not render
the action. The `user` / `ctx.user` / `os.user` aliases are the same call.

This is client-side UI gating only. It decides whether the button is shown; the server
still enforces object permissions on the request the action sends and answers 403 when
they are not held.

- `@object-ui/permissions`: the permission context carries `effectiveObjects`, the
  response's `objects` map verbatim (`undefined` when the provider holds no such
  response — the role-based `PermissionProvider`, or no provider at all).
- `@object-ui/core`: `evalFieldPredicate` hands the acting subject's permissions to the
  CEL engine as `EvalContext.permissions`; `bindSubjectPermissions` /
  `subjectPermissionsOf` are the carrier. `@objectstack/formula` is now required at
  `^17.5.0`, the first release that answers `can`.
- `@object-ui/app-shell`: `ExpressionProvider` binds the map into the predicate scope it
  publishes only while `usePermissions().isLoaded` is true, and the record-form field
  evaluators take the same input, so one predicate answers the same everywhere.
