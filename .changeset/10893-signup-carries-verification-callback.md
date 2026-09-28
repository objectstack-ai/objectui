---
'@object-ui/auth': minor
'@object-ui/console': patch
---

fix(auth, console): a registration started from an invitation link comes back to the invitation after email verification

better-auth builds the verification mail's link server-side from the
`/sign-up/email` request's `callbackURL`, defaulting it to `/`. The console kept
`?redirect=/accept-invitation/ID` from the login page through `/register` to the
"check your inbox" screen, but `createAuthClient().signUp` never sent a
`callbackURL`, so the mail read `callbackURL=/` and the invitee verified onto the
workspace picker ("Create workspace") instead of the invitation.

`@object-ui/auth` (additive):

- `SignUpData.callbackURL` is forwarded verbatim to `/sign-up/email`. Absent, the
  key stays off the wire and the server default is untouched.
- `useAuth().signUp(name, email, password, callbackURL?)` takes it as an optional
  fourth argument.
- `RegisterForm` gains a `verificationCallbackURL` prop, forwarded to `signUp`.

`@object-ui/console`:

- `RegisterPage` passes a safe `?redirect=` as the verification callback, and the
  verify-email prompt's "Resend" sends the same value. Before, Resend sent the
  bare router path, which the server redirects to at the ORIGIN root, outside
  the `/_console` mount.
- Both resolve the route through the new `withConsoleBaseRootRelative`. The server
  never sees `<base href>`, and better-auth refuses a document-relative `./…`
  callback — what `withConsoleBase` answers in the embedded build — with
  `403 INVALID_CALLBACK_URL`, failing the whole sign-up.
