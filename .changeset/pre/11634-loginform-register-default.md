---
'@object-ui/auth': minor
---

`LoginForm` shows its "Don't have an account? Sign up" row only when the caller passes `registerUrl` (objectui#11634). The prop used to default to `'/register'`, so a caller that passed `undefined` to withhold the link got it back. Both console login pages pass `undefined` when the server's `/auth/config` reports `emailPassword.disableSignUp: true`, so a deployment with sign-up turned off still offered a sign-up link. The server refused the sign-up and `/register` sent the user back to the login page.

**Behaviour change.** A `LoginForm` rendered without `registerUrl` no longer shows a sign-up link. A caller that left the prop out and relied on the `'/register'` default now passes the URL itself, `registerUrl="/register"`, to keep the link. The console app's login page and `@object-ui/app-shell`'s `DefaultLoginPage` already pass the URL whenever sign-up is on, so neither changes. Leaving the prop out, or passing `undefined`, is the one way to render no link: no second "off" value is added.

**Clause-②: no.** The prop's type is unchanged (`registerUrl?: string`). No export, prop, type member or i18n key is added or removed.
