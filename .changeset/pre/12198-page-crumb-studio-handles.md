---
'@object-ui/app-shell': patch
'@object-ui/i18n': minor
---

A page route's breadcrumb no longer carries a 「Pages」 crumb (objectui#12198, executing the maintainer's ruling on objectstack-ai/cloud#2768). **BREAKING** for `@object-ui/i18n`: the pack key `console.breadcrumb.pages` is retired from all ten language packs, with no replacement.

- **`@object-ui/app-shell`.** On `/apps/APP/page/NAME`, the top bar's trail used to read app › Pages › page (on the cloud home: Cloud › Pages › Home). 「Pages」 named a metadata type, not a place the user went, and its link only reopened the app's base, which the app pill already does. The trail now goes from the app pill straight to the page. Dashboard, report, system and object routes draw their trails as before.
- **`@object-ui/i18n`.** `console.breadcrumb.pages` had one reader, the crumb above, and is removed from the `en`, `zh`, `ja`, `ko`, `de`, `fr`, `es`, `pt`, `ru` and `ar` packs. A host that looked the key up through the published packs now gets the key string back, and has nothing to read instead: no screen draws a type crumb ahead of a page any more. The other `console.breadcrumb.*` keys are unchanged.

The Studio entries a page route offers — the page's pencil, the top bar's 「Edit app」 button and the app pill's Studio row — still need both the workspace-admin flag and the server-reported `manage_metadata` capability. That gate is unchanged; this release adds pins that a workspace admin without `manage_metadata` (an organization owner) and a plain member see none of the three.

**Clause-②: no (narrowing).** One published pack key is removed; nothing is added and no accepted input widens.
