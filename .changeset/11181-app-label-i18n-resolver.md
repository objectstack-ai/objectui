---
'@object-ui/app-shell': patch
---

fix(app-shell): Studio prints an app's own locale-map label in the designer locale instead of `[object Object]`

The spec types an app's `label` as `I18nLabel`: a plain string or an inline
locale map keyed by language tag (`en`, `zh-CN`, ...). Studio's Interfaces
pillar read that label with `String()`, both from the package's app list and
from the loaded app, so an app with a locale-map label showed
`[object Object] · Navigation` as the navigation rail's heading.

The heading now shows the label's text in the designer locale, as the nav
rows beside it do, and it changes with the designer language. The Data
pillar's Actions view reads an action's locale-map label the same way: it
used a fixed order of its own (`default`, `en-US`, `en`, `zh-CN`), so under
Chinese it showed the English text of a label that carries both.

A plain-string label shows as authored, as before.
