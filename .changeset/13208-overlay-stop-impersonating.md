---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

The console's remediation overlay offers "Stop impersonating" on an impersonation session (objectui#13208). The overlay covers the whole console, the impersonation banner included, so an administrator who impersonated a user held by `PASSWORD_RESET_REQUIRED`, `PASSWORD_EXPIRED` or `MFA_REQUIRED` was shown that user's own change-password or authenticator-enrolment form, and could only leave by signing out. When the session carries `impersonatedBy`, the overlay now says the user must do it themselves, offers neither form, and offers "Stop impersonating" beside "Sign out instead". The stop is the banner's own exit, shared rather than copied. Once the administrator's session is restored, the overlay clears the gate and reloads. A stop that fails, or that restores nobody, keeps the overlay up and says so. On an ordinary session the overlay is unchanged, and it still appears for whatever posture the server reports.

The impersonation banner no longer reports a later impersonation as a failed stop. After a stop that worked, impersonating someone else without a reload showed "The server accepted the request but did not restore your administrator session" on the new session, which nobody had tried to stop. The outcome of a stop now answers only for the session it was made from.

`@object-ui/i18n` adds three strings under `auth.remediation.impersonation` (`passwordTitle`, `mfaTitle`, `body`) in all ten locale packs.
