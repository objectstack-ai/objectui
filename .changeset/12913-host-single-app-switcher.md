---
'@object-ui/app-shell': minor
---

A host can ask the console to draw no app switcher when the viewer is served one app (objectui#12913, the objectui half of objectstack-ai/cloud#2919).

`AppShellRuntimeConfig` takes one new optional member, `hideSingleAppSwitcher`, read from `GET /api/v1/runtime/config`. Only a literal `true` turns it on. It is read again from each payload, so a later payload without it turns it off, and a runtime that does not send it keeps today's top bar.

- **The rule.** Inside an app, `AppSwitcher` draws the app's glyph and name with no dropdown when the host sends `hideSingleAppSwitcher: true` AND the viewer's app list holds exactly one active, un-hidden app. That count reads the same list the dropdown draws, so hidden apps (reached from the avatar menu) and inactive ones do not count, and Setup does. Without the dropdown there is no 「Back to home」, 「All apps」 or 「Settings」 row. The product mark still links home, and `⌘⇧H` / `Ctrl+Shift+H` still goes home.
- **Who keeps the switcher.** A viewer served two or more un-hidden apps keeps the pill and its rows, because the pill is how they reach the other app. So does a viewer served Setup as well, who keeps the 「Settings」 row. Every deployment whose host does not send the key keeps the pill and the objectui#12605 rows as before.
- **The platform-stage chip** still follows the app's name, in the slot where it followed the pill.

This widens the published `AppShellRuntimeConfig` type with an optional member. No other export, prop or language-pack key is added. `isSingleAppSwitcherHidden()` is a module-level reader in `runtime-config.ts`, like `isStorageUsageServed()`, and is not on the package entry.
