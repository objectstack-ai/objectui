---
'@object-ui/app-shell': patch
---

Studio's Interfaces pillar no longer loses its nav rail when a nav item's label is a locale map (objectui#11158).

The spec types a nav item's `label` as `I18nLabel`: a plain string or an inline
locale map such as `{ en: 'Home', 'zh-CN': '首页' }`. The pillar's rail rendered
the label raw, so a map made React throw ("Objects are not valid as a React
child") and the whole rail disappeared. The open leaf's canvas caption and
breadcrumb printed `[object Object]` for the same item.

The rail now shows a map label's text in the designer locale: in the group
heading, in the entry, and in the tooltip of an entry with no design surface.
The open leaf's caption and breadcrumb show the same text, whether the leaf was
opened from the rail, opened first by default, or restored from a `?surface=`
link. A plain-string label renders as before.
