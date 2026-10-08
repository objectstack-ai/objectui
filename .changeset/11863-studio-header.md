---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
'@object-ui/console': patch
---

The Studio landing (`/studio`) gets the console's own header (objectui#11863). Its old header held one control, the product wordmark linking back to Home. It now mounts `AppHeader` with `variant="studio"`: the brand logo, then a fixed "Studio" crumb, then the header's right-hand cluster as on Home and the Workspaces page (the inbox, help, and the account menu with profile, theme, language and sign-out). The brand links to the declared landing (`useHomePath()`), as the wordmark did, so the landing and the Studio builder's Home button still name one home. No command palette is mounted on `/studio`, so the header shows no search trigger there.

**Clause-②: yes (widening; and one narrowing in `@object-ui/i18n`).** `AppHeader`'s `variant` prop accepts a fourth member, `'studio'`, beside `'app'`, `'home'` and `'orgs'`. It draws the brand and a fixed crumb, as `'orgs'` does. The union is not exported by name (the package entry exports `AppHeader` only), so a host meets it as the prop's type: a host that switches exhaustively over that type must handle `'studio'`. A call that passes no `variant` resolves it as before (`'app'` with an `appName`, `'home'` without). No export is added or removed.

`@object-ui/i18n`: each of the ten packs gains `console.studio.title` ("Studio", a product name every pack writes as is), the crumb's label, and drops `console.studio.backToHome`, the retired wordmark's tooltip, which nothing reads any more.

**Narrowed public surface (`@object-ui/i18n`).** The exported `en` pack and the `TranslationKeys` type derived from it lose one member, `console.studio.backToHome`. Code that reads `en.console.studio.backToHome`, or passes that key to `t()` expecting a translation, has to drop it. This is released as `minor` under objectui's version policy, which keeps the major aligned with `@objectstack`.
