---
'@object-ui/plugin-form': minor
---

A master-detail form whose `title`, `submitText` or `cancelText` is a per-locale map now shows the viewer's language instead of crashing or toasting "[object Object] saved" (objectui#10935).

**What it was.** `@objectstack/spec` types these three members of `object-master-detail-form` as `I18nLabel`, a plain string or an inline per-locale map such as `{ en: 'Purchase order', 'zh-CN': '采购单' }`, and objectui's validator accepts such a map in the node's `properties` (objectui#10927). `MasterDetailForm` read all three raw. `submitText` and `cancelText` are Button children, so a map threw "Objects are not valid as a React child" and took the form down. A map `title` went into the built-in edit-save toast as "[object Object] saved".

**What changed, in observable terms.**

- Each of the three is resolved with `pickLocalized` against the active UI language (`useObjectTranslation().language`), the source `ObjectMetricWidget` resolves its own `I18nLabel` members against. A map shows the entry for the viewer's language, then falls back the way `pickLocalized` does.
- A plain string renders exactly as authored.
- With nothing authored, the English defaults are unchanged: 'Create' or 'Save' on the Save button, 'Cancel' on the Cancel button, and 'Created' or 'Saved' in the built-in save toast. These defaults are still English (author the label to show another language), and so is the " saved" the toast puts after an authored `title`.
- On the two buttons, an authored empty string, or a map with no string entry, now shows the English default. An authored empty string used to render an empty button; a map with no string entry used to throw as a React child.
- The parent `ObjectForm` is handed the resolved `title` string, the `string` its `ObjectFormSchema.title` declares.
- The block's registration declares both arms for the three keys, `type: ['string', 'object']`, with descriptions that teach the per-locale map. The manifest built from `ComponentRegistry.getPublicConfigs()` therefore no longer makes `validateTree` report `type-mismatch` on a locale map for these keys. A value that matches neither arm, such as a number, is still reported.

**Types.** `MasterDetailFormSchema.title`, `.submitText` and `.cancelText` widen from `string` to `I18nLabel` (from `@object-ui/types`), matching the spec row. Code that writes these members compiles unchanged. Code that reads one of them and uses it as a `string` no longer compiles: resolve it first, for example with `pickLocalized` from `@object-ui/i18n`.

**Clause-②: yes** — three members of `MasterDetailFormSchema`, which the package entry exports, widen from `string` to `I18nLabel`, and the registration's `inputs` for the same three keys widen from `'string'` to `['string', 'object']`. Nothing that was accepted before is refused now.
