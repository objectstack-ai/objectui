---
'@object-ui/i18n': minor
---

New `auth.login` strings for the console login page, in all ten language packs (objectui#12600): `welcomeTitle`, `welcomeDescription`, `showPasswordText`, `hidePasswordText`, `footer.privacy`, `footer.terms` and `devAdminHint.signIn`. `auth.login.devAdminHint.title` now reads "Local development instance" (was "Development instance").

Removed from all ten packs: `auth.login.devAdminHint.body` and `auth.login.devAdminHint.dismiss`. They named the retired dev-admin banner's credentials line and its dismiss button, and nothing reads them any more. A host that called either key now gets the key back instead of text.
