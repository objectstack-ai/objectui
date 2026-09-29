---
'@object-ui/plugin-form': patch
'@object-ui/plugin-view': patch
'@object-ui/types': minor
---

An `object-form` whose `title`, `description`, `submitText`, `cancelText`, `nextText`, `prevText` or `successMessage` is a per-locale map now shows the viewer's language instead of failing to render (objectui#10993).

**What it was.** `@objectstack/spec` types these seven members of `object-form` as `I18nLabel`: a plain string or an inline per-locale map such as `{ en: 'Save order', 'zh-CN': '保存订单' }`. `ObjectForm` handed all seven raw to the presentation its `formType` picked, and every presentation that displays one renders it as a React child. A map therefore threw "Objects are not valid as a React child", and the node rendered `Component "form" failed to render` instead of a form.

**What changed, in observable terms.**

- `ObjectForm` resolves the seven with `pickLocalized` against the active UI language (`useObjectTranslation().language`), once, before it picks a presentation. So the simple, tabbed, split and wizard forms, the drawer and modal presentations, and the master-detail route all receive the entry for the viewer's language, with the fallback chain `pickLocalized` applies.
- A plain string renders exactly as authored. With nothing authored, every presentation shows the default label it showed before.
- A map with no string entry resolves to nothing, so the presentation's default label shows.
- `object-view`'s `form` slot takes `ObjectFormSchema`'s keys, so its `form.title` and `form.description` are `I18nLabel` too. `ObjectView` draws its own drawer and modal header around the form, and it now resolves both the same way, against the same UI language, where it used to read them raw.
- The `object-form` registration declares both arms for the seven keys, `type: ['string', 'object']`, with descriptions that teach the per-locale map. The manifest built from `ComponentRegistry.getPublicConfigs()` therefore no longer makes `validateTree` report `type-mismatch` on a locale map for these keys. A value that matches neither arm, such as a number, is still reported.

**Types.** In `@object-ui/types`, `ObjectFormSchema.title`, `.description`, `.submitText`, `.cancelText`, `.nextText`, `.prevText` and `.successMessage` widen from `string` to `I18nLabel`, matching the spec row. The zod mirror's `title`, `description`, `submitText`, `cancelText` and `successMessage` widen from `z.string()` to the spec's `I18nLabelSchema`, by reference, so `safeValidateSchema` accepts a locale map on them; a number is still refused at the member. `nextText` and `prevText` stay unmirrored, as before. Code that writes these members compiles unchanged. Code that reads one of them off an `ObjectFormSchema` and uses it as a `string` no longer compiles: resolve it first, for example with `pickLocalized` from `@object-ui/i18n`.

**Clause-②: yes** — seven members of the exported `ObjectFormSchema` type, and five members of its zod mirror, widen from a string to `I18nLabel`, and the registration's `inputs` for the seven keys widen from `'string'` to `['string', 'object']`. Nothing that was accepted before is refused now.
