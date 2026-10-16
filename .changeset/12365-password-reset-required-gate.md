---
'@object-ui/auth': minor
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

A user whose administrator forced a password change gets the change-password overlay instead of raw `403` responses (objectui#12365).

The ObjectStack backend answers an administrator-forced password change with `403 PASSWORD_RESET_REQUIRED`, its own code distinct from natural expiry `PASSWORD_EXPIRED` (objectstack#23287 ruling C′, carried by objectstack#23440).

- **`@object-ui/auth`:** the authenticated fetch wrapper now treats `PASSWORD_RESET_REQUIRED` as an auth-policy gate, like `MFA_REQUIRED` and `PASSWORD_EXPIRED`, so `AuthProvider` sets `remediationRequired` for it. Before the backend emits the code this changes nothing.
- **`@object-ui/app-shell`:** `RemediationOverlay` routes `PASSWORD_RESET_REQUIRED` to the change-password form. It shows the title "You must change your password" for it, because "Your password has expired" is false for a forced reset. `PASSWORD_EXPIRED` keeps its title.
- **`@object-ui/i18n`:** adds `auth.remediation.password.resetTitle` to all ten built-in language packs.

No export is added or removed, and the type of `remediationRequired` (`{ code: string; message: string }`) is unchanged.
