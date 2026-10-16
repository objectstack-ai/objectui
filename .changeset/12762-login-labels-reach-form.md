---
'@object-ui/i18n': patch
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

An SSO sign-in reads in the session's language on both login pages (objectui#12762). The console's login page and app-shell's `DefaultLoginPage` passed `LoginForm` none of its four SSO labels, and no bundle had keys for them, so a non-English console showed `LoginForm`'s English defaults: "Sign in with your organization's single sign-on" and "Use a password instead" under SSO-only mode, and "Sign in with SSO" and "Back to single sign-on" once the password form was opened.

- **`@object-ui/i18n`** adds `auth.login.ssoButton`, `auth.login.ssoOnlyDescription`, `auth.login.usePasswordText` and `auth.login.backToSsoText` to all ten bundles. The English values are `LoginForm`'s own defaults, so an English session reads exactly as before.
- **Both login pages** pass those four labels. **`DefaultLoginPage`** also passes the ten phone and verification-code labels (`emailOrPhoneLabel` through `usePasswordSignInText`), from the `auth.login.*` keys the console's page already read, so its phone sign-in is translated too.

Both pages now pass every `LoginFormLabels` member. No export, prop or type is added, removed or renamed.
