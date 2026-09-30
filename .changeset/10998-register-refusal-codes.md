---
'@object-ui/console': patch
'@object-ui/i18n': patch
---

fix(console): a sign-up refused by the server's audience gate reads in the session's language (objectui#10998)

When an environment admits new accounts by invitation only (the server's default)
or only from allowlisted email domains, the server refuses `/sign-up/email` with
`403 SELF_REGISTRATION_CLOSED` or `403 EMAIL_DOMAIN_NOT_ALLOWED`. The console's
register page mapped only the user-exists codes to pack text, so either refusal
showed the server's English message in every language, and the invitation-only
refusal also named the internal setting behind it.

- `@object-ui/console`: `RegisterPage` maps both codes to localized text. A code it
  does not map still shows the server's own message.
- `@object-ui/i18n`: all ten locale packs carry the two new keys,
  `auth.register.errors.selfRegistrationClosed` and
  `auth.register.errors.emailDomainNotAllowed`. No existing value changes.
