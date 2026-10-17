---
'@object-ui/i18n': patch
'@object-ui/console': patch
---

A settings row's chips read in the session's language (objectui#12821). The env-lock chip said "Locked by env" in every language, and its title, shown when the server names no reason, was English too; the `Deprecated` chip (with its replacement key) and the row drawn for an unsupported specifier type were English literals as well.

- **`@object-ui/i18n`** adds `console.settingsView.envLockBadge`, `envLockBadgeTitle`, `deprecatedBadge`, `deprecatedBadgeReplacedBy` (with `{{replacedBy}}`) and `unsupportedSpecifierType` (with `{{type}}`) to all ten bundles. The English values are the old wording, so an English session reads exactly as before.
- **The console's settings page** draws those chips from these keys. A reason the server sends (`lockedReason`, such as "Set via env: NAME") is still shown as served.

No export, prop or type is added, removed or renamed.
