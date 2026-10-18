---
'@object-ui/console': minor
'@object-ui/auth': minor
---

The console's login and register pages offer a generic sign-up only where the server would accept one (objectui#11691). `/api/v1/auth/config` states the sign-up rule as two keys, `emailPassword.disableSignUp` and `features.audiencePosture`, and the server deliberately does not force the first from the second: under `invite_only` its sign-up route still admits a pending invitee. The pages read only `disableSignUp`, so under the default `invite_only` posture `/login` offered "Sign up" and `/register` refused the finished form with `SELF_REGISTRATION_CLOSED`.

Both pages now read both keys:

- `disableSignUp: true` still hides sign-up outright, invitation links included.
- Under `open` or `email_domain`, nothing changes.
- Under `invite_only`, `/login` shows no "Sign up" link. A visitor who arrived from an invitation (`?redirect=/accept-invitation/ID`, the signed-out bounce of the invitation page) still gets the link, and `/register` still renders the form for them. A deployment with no owner yet (`GET /api/v1/auth/bootstrap-status` answers `hasOwner: false`) keeps the link for its first owner, because the server admits the first account under every posture.
- Otherwise `/register` says that self-registration is not open and points back to sign-in, before any field is filled in, instead of refusing the submitted form.
- A server that sends no `audiencePosture` is answered as before, by `disableSignUp` alone. A posture value the console does not recognise reads as closed.

**Clause-②: yes.** `@object-ui/auth`'s published `AuthPublicConfig.features` gains an optional `audiencePosture` member, typed as `@objectstack/spec`'s `AudiencePosture`. The package's `@objectstack/spec` range moves from `^17.0.0` to `^17.3.0`, the first release that declares that type. No export, prop or i18n key is added or removed: the register page's explanation reuses the existing `auth.register.errors.selfRegistrationClosed` sentence.
