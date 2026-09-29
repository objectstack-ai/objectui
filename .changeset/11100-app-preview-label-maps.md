---
'@object-ui/app-shell': patch
---

fix(app-shell): Studio's app preview resolves a locale-map app, nav-item and group label (objectui#11100)

The spec types an app's `label`, each navigation item's `label` and each group's `label` as
`I18nLabel`, a plain string or an inline locale map. The app preview read all three as strings,
so an author who localized the app's name or its navigation saw a wrong preview:

- the app label printed `[object Object]`, because the header ran `String()` over it;
- a childless navigation item with a map label vanished, target and all, because the reader kept
  a label only when `typeof it.label === 'string'`;
- a group with a map label read `(unnamed)`, for the same reason.

All three now resolve through `resolveI18nLabel` in the designer locale, the way the areas list
beside them already does. A navigation item is kept whenever it names a record or holds children;
its label only decides the text, and `(unnamed)` now reads only for a label that is truly absent
(or a map that resolves to nothing). An app that authors no label still shows its own name.

What an author sees change: an entry that names a record but carries no label used to disappear
from the preview and now shows as `(unnamed)`.
