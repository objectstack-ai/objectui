---
'@object-ui/plugin-grid': patch
---

An `object-grid` whose deprecated `title` is a per-locale map now shows the viewer's language in the table caption and the export file name, instead of failing to render (objectui#10993, batch 3).

**What it was.** `title` is the legacy spelling of `label`, read only when `label` resolves to nothing. `@objectstack/spec` types it as `I18nLabel`: a plain string or an inline per-locale map such as `{ en: 'Accounts', 'zh-CN': '客户' }`. `ObjectGrid` resolved `label` against the display locale at its two reads, the data-table caption and the export file name, but handed `title` on raw. A map therefore reached the caption as an object, the data-table threw "Objects are not valid as a React child", and the node rendered `Component "data-table" failed to render` instead of the grid; in the export file name the same map would have read `[object Object]`.

**What changed, in observable terms.**

- The caption and the view label in the export file name take the `title` entry for the display locale, the same channel `label` uses: the workspace's regional default when one is configured, otherwise the active UI language.
- `label` still wins whenever it resolves to something, and a plain-string `title` renders exactly as authored.

No registry input changes: `title` stays one of the block's unregistered deprecated spellings, so `validateTree` reads it as before.
