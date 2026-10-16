---
'@object-ui/i18n': minor
'@object-ui/console': patch
---

A caller without Studio access who opens a Studio URL (`/studio`, a package's pillar builder, or the package-less scope) is told why (objectui#12035). The console's Studio entry gate used to send such a caller home with no word of why, so a missing capability read exactly like a broken link. It now stays at the URL that was opened and shows one sentence, "You need Studio access to open Studio.", with a "Back to home" link drawn as a button. This is the shape the console already uses for an app the caller may not open. The link leads to the same home the redirect used to land on: the declared landing, or the launcher where none is declared. A reload or a shared link shows the same answer for the same caller, and the caller can send the URL to an administrator and reload once access is granted.

Who may enter Studio is unchanged: the gate still requires `studio.access`, decides before the Studio builder is downloaded, and keeps its loading splash and its retryable error screen. A caller with access enters Studio as before.

**Clause-②: yes (widening).** `@object-ui/i18n` gains one key in all ten packs, `console.studio.accessRequired`, the sentence above, so the exported `en` pack and the `TranslationKeys` type derived from it gain one member. No key is removed or renamed. The link reuses `empty.appAccessDeniedHome` for its label.
