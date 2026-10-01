---
'@object-ui/types': minor
---

fix(types): a navigation entry's `label` accepts an inline locale map, as the spec does (objectui#11299)

`@objectstack/spec` declares a navigation entry's `label` as `I18nLabel`: a plain
string, or an inline locale map such as `{ en: 'Accounts', 'zh-CN': '客户' }`. The
platform's save door accepts the map, but `objectui validate` refused it with
"expected string, received object", because this package declared the label as a
string.

- `NavigationItemSchema` now takes the spec's `I18nLabelSchema` by reference for an
  entry's `label`, so `objectui validate` and the platform judge a nav label alike:
  a map the spec accepts passes, and a map the spec refuses (a keyed
  `{ key, defaultValue }` reference, a non-string entry, a key that is not a locale
  tag) is refused here too.
- `NavigationEntryItem.label` is typed as the spec's `I18nLabel`. Code that reads
  `item.label` directly now sees `string | InlineLocaleMap`; resolve it through
  `resolveNavItemLabel` from `@object-ui/layout` (which also handles an absent
  label) rather than treating it as a string.
- An empty string label is still refused, as before: omit the key to inherit the
  target's label.
