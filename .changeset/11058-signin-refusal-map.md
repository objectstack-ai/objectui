---
'@object-ui/app-shell': minor
'@object-ui/console': patch
---

fix(app-shell): the exported sign-in page says why a sign-in is refused, in the reader's language (objectui#11058)

`DefaultLoginPage` (mounted at `/login` by `examples/console-starter`) passed no
`errorMessages` to `LoginForm`, so a wrong password or an unverified email showed
the server's English message in every language.

- `@object-ui/app-shell`: new export `signInRefusalMessages(t)`, the one map from
  a sign-in refusal code to pack text (`INVALID_EMAIL_OR_PASSWORD` to
  `auth.login.errors.invalidCredentials`, `EMAIL_NOT_VERIFIED` to
  `auth.login.errors.emailNotVerified`). `DefaultLoginPage` passes it. A code the
  map does not name still shows the server's own message.
- `@object-ui/console`: `LoginPage` passes the same map instead of its own
  hand-written copy. What it shows does not change; its redirect to the
  verify-email prompt on `EMAIL_NOT_VERIFIED` stays as it was.
