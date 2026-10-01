---
'@object-ui/layout': minor
---

feat(layout): a navigation label written as an inline locale map renders in the viewer's locale; three inert resolver props retire (objectui#11299)

**Breaking for a consumer that passes the retired props or calls `resolveNavItemLabel` with six arguments** — a compile error, never a silent change of what renders.

- **New: `NavigationRenderer`'s optional `locale` prop**, and a trailing `locale`
  argument on `resolveNavItemLabel`. A present entry label written as an inline locale
  map (`{ en: 'Accounts', 'zh-CN': '客户' }`) renders the entry for that locale, through
  the spec's own `resolveI18nLabel`; when the map has no entry for it, that resolver's
  fallback order applies. objectui#11201 rendered such a map's `en` entry for every
  viewer; pass the viewer's language as `locale` to show theirs. Without `locale` the
  map still reads its `en` entry. A plain-string label and an absent label are
  unaffected.
- **Retired: `NavigationRenderer`'s `resolveObjectLabel`, `resolveDashboardLabel` and
  `resolveViewLabel` props.** objectui#11201 stopped reading them and kept them as
  no-ops; they are removed now. Delete them from your `NavigationRenderer` call. An
  unlabelled entry's localized text comes from `resolveTargetLabel`, as before.
- **Changed signature: `resolveNavItemLabel(item, t?, targetLabel?, locale?)`.** The
  2nd, 4th and 5th arguments (the same three resolvers) are gone. A call written
  `resolveNavItemLabel(item, undefined, t, undefined, undefined, targetLabel)` becomes
  `resolveNavItemLabel(item, t, targetLabel, locale)`.

Marked `minor`, not `major`: this repository's fixed release group follows the
`@objectstack` major, so a breaking change of its own is declared `minor` with the
break spelled out here.
