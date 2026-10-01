---
'@object-ui/layout': patch
---

fix(layout): a present navigation label renders as written, with no exception, and an inline locale-map label renders its text (objectui#11201)

A navigation entry's text now follows one rule. A present label is shown as written. An absent label
shows the current, localized label of what the entry opens.

- **Visible change.** An entry whose stored label is its target's machine name (for example
  `account`, `sales_overview`) used to be translated, because the sidebar looked that text up as
  the object's, view's or dashboard's name. It now shows the name as written, in every locale.
  **To fix such an entry:** clear its label so it inherits the target's localized label, or set the
  text you want shown. Stored navigation is not converted, and no notice is sent.
- An entry label written as an inline locale map (`{ en: 'Accounts', 'zh-CN': '客户' }`) used to
  render as empty text. It now renders the map's text. The sidebar is not told the viewer's locale,
  so it reads the `en` entry, then `default`, then any entry, as it already does for an area label.
- `NavigationRenderer`'s `resolveObjectLabel`, `resolveDashboardLabel` and `resolveViewLabel` props,
  and the matching arguments of `resolveNavItemLabel`, are no longer read. They are still accepted,
  so no caller breaks. An unlabelled entry's localized text comes from `resolveTargetLabel`.
