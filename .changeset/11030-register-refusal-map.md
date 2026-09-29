---
'@object-ui/app-shell': minor
'@object-ui/console': patch
---

fix(app-shell): the exported register page says why a sign-up is refused, in the reader's language (objectui#11030)

`DefaultRegisterPage` (mounted at `/register` by `examples/console-starter`)
passed no `errorMessages` to `RegisterForm`, so every refused sign-up showed the
server's English message in every language. For `SELF_REGISTRATION_CLOSED` that
message also names the internal setting behind the refusal.

- `@object-ui/app-shell`: new export `signUpRefusalMessages(t)`, the one map from
  a sign-up refusal code to pack text (`auth.register.errors.userExists`,
  `.selfRegistrationClosed`, `.emailDomainNotAllowed`). `DefaultRegisterPage`
  passes it. A code the map does not name still shows the server's own message;
  `AUTH_CONFIG_ERROR` stays unmapped on purpose, because its message is written
  for the operator.
- `@object-ui/console`: `RegisterPage` passes the same map instead of its own
  hand-written copy. What it shows does not change.
