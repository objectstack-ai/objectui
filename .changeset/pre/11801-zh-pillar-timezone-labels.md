---
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

zh-CN Studio names a pillar by the label its tab shows, and the settings label lookups stop logging missing-translation warnings for text they fall back from by design (objectui#11801).

- **Studio, zh-CN.** Two hints called a Studio pillar 支柱, a literal rendering of the code word "pillar" that no tab shows, and left the pillar's name in English: the navigation-item inspector's "no objects yet" line and the Interfaces pillar's hint under an object's runtime preview. Both now name the pillar by its tab label, 「数据」. The second hint took the word "Data" from a literal in the component rather than from the string table, so it read English in every language; it now reads the tab label, and en-US shows the same text as before.
- **Console settings.** `useSettingsLabel` finds a setting's translated label, help line and option labels by probing a convention key in each top-level translation namespace that has a `settings` member, and shows the manifest's own text when the probe misses. Every miss went through `t()`, so a development build logged one "Missing translation" warning per probe, most visibly for the timezone field of the workspace-timezone prompt an administrator sees at an app's first open. The lookup now asks i18next whether the key exists before translating it, which logs nothing. What the prompt and the Settings page show is unchanged.

Nothing is added to a package entry: no export, prop, type member or language-pack key.
