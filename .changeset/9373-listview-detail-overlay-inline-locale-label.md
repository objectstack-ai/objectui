---
'@object-ui/plugin-list': patch
---

`ListView`'s record-detail overlay heading resolves an inline locale map
(objectui#9373).

`ListViewSchema.label` is an `I18nLabel` — a plain string **or** an inline locale
map such as `{ en: 'Accounts', 'zh-CN': '客户' }`. The `detailTitle` computation
handed the raw member into the interpolation options of
`detail.recordDetailWithLabel`, so a map-valued label reached the interpolator as
an object and the heading rendered `[object Object] Detail`. That value is
`NavigationOverlay`'s `title` prop, which objectui#3426 established is the visible
heading of the record-detail drawer / modal / split / popover — so the corruption
was on user-visible chrome, in every locale, on both interpolators (the i18next
one and the provider-less fallback that stringifies with `String`).

No compiler run could have named the site: `createSafeTranslation`'s options bag
is declared as a record of `unknown`, which accepts the map without a diagnostic.
Nothing but an executed assertion holds it, which is why the repair ships with
pins on both interpolator legs.

The label is now resolved through `resolveI18nLabel` on the same `displayLocale`
this component already uses for the view label and the nested `aria` bag —
**before** the truthiness test rather than inside the branch, because
`resolveI18nLabel` answers `undefined` for a map with no usable entry and `''`
for an empty entry, and both have to fall through to the `objectName` branch the
way a missing label always did. Every object is truthy, so a resolution placed
inside the branch cannot do that.

Output for a string-valued `label` is unchanged, byte for byte, in every locale
and with no provider mounted.
