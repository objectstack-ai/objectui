---
'@object-ui/app-shell': patch
---

fix(app-shell): Studio's nav-item inspector shows a locale-map label and edits only the designer locale's entry

A nav item's `label` is an `I18nLabel`: a plain string or an inline locale map such as `{ en: 'Accounts', 'zh-CN': '客户' }`. The Studio's nav-item inspector (the right panel beside the app designer's canvas) read the label as `String(label ?? title ?? name)`. A map therefore showed as `[object Object]`, and one keystroke in the Label input wrote a plain string over the whole map, so every other language's text was lost.

The inspector now shows the label resolved in the designer locale through the spec's `resolveI18nLabel`, the way the canvas card beside it does. An edit of a map writes only the designer locale's entry (the exact tag, else the bare language, else a new exact-tag entry) and keeps every other entry. A plain-string label still edits to a plain string. Binding an object keeps a real map label as authored, and adopting the object's label on a placeholder item follows the same rule. `title` and `name` are not nav-item keys and are no longer read as the label.

The canvas and the inspector now share one internal module for both the display and the key choice, so the two editors of one label cannot disagree about which entry an edit changes.
