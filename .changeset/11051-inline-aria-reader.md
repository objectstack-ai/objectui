---
'@object-ui/react': minor
'@object-ui/components': patch
---

`element:text`, `element:button`, `element:image` and `element:number` now render the accessible name an author declares in their `aria` prop (objectui#11051).

**What an author sees change.** These four elements declare the spec's `AriaPropsSchema` as their `aria` prop. The renderer used to put `aria-` in front of each key as written, so `aria: { ariaLabel: 'Order total' }` reached the DOM as `aria-arialabel="Order total"`. No assistive technology reads that attribute, so the element had no accessible name. A locale map (`{ en: 'Order total', 'zh-CN': '订单合计' }`) was written as `[object Object]`. Now:

- `ariaLabel` renders `aria-label`. A locale map gives the entry for the display locale (`useDisplayLocale()`), resolved by the spec's own `resolveI18nLabel`.
- `ariaDescribedBy` renders `aria-describedby` (it rendered `aria-ariadescribedby`).
- `role` renders `role`, as before.

**New export: `resolveInlineAriaProps(aria, locale)` from `@object-ui/react`.** A pure function, not a hook: it maps the spec's nested `aria` bag to those three attributes, and returns only the ones that have a value. It is exported so the renderers in `@object-ui/components` share one mapping. `SchemaRenderer`'s own reader for the FLAT node keys (`ariaLabel` in the keyed `{ key, defaultValue }` form) is unchanged: objectui#4580 Q2-B keeps the two vocabularies apart, and each resolver returns nothing useful for the other's shape.

**What is no longer read.** The old helper also passed any raw `aria-*` key straight through, and turned any other key into `aria-KEY`. So an `aria: { label: 'x' }` rendered `aria-label="x"` by accident. The spec refuses both shapes when it parses the document (`unrecognized_keys`), and these four elements now ignore them. When this change was made, a `git grep` found no example app, doc or skill in this repository or in the ObjectStack framework that puts an `aria` bag on these four elements, so no shipped document depended on those shapes. If you wrote one, use `aria: { ariaLabel: 'x' }`.
