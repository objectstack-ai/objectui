---
'@object-ui/i18n': patch
'@object-ui/console': patch
---

A settings row's source badge reads in the session's language, verb included (objectui#12694). The badge beside a setting's label said where its value comes from as an English verb beside a translated layer name, so a zh-CN admin who saved a workspace value read "Overrides 默认".

- **`@object-ui/i18n`** adds `console.settingsView.sourceBadgeInherited` and `console.settingsView.sourceBadgeOverrides` to all ten bundles. Each is one sentence with the layer's name as `{{source}}`, so a language puts the layer where its grammar needs it. The English values are the old wording, so an English session reads exactly as before.
- **The console's settings page** draws both badges from those keys. The layer's name is still the server's `settingsCommon.sourceLabels` label.

No export, prop or type is added, removed or renamed.
