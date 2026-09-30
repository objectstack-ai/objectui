---
'@object-ui/app-shell': patch
---

fix(app-shell): selecting a dashboard widget whose title is a per-locale map no longer crashes the designer canvas

`DashboardWidget.title` is the spec's `I18nLabel`, so it can be a string or an
inline per-locale map such as `{ 'en-US': 'Revenue', 'zh-CN': '收入' }`. The
dashboard designer's selected-widget strip rendered the stored value as a React
child. Selecting a widget with a map title threw "Objects are not valid as a
React child", and the whole preview was replaced by "Preview failed to render".

The strip now resolves the title with the spec's `resolveI18nLabel` in the
designer locale. That is the call the preview already makes for the selection
label, and the rename draft is seeded from the same string. The inline rename
saves through `setLocalized`, the same write the widget inspector's title field
uses. For a map title it replaces the entry the designer locale resolves to
within its own language (the exact tag, else the base language, else a regional
variant of it). When the map has no entry in that language, it adds one under
the designer locale. Every other locale is kept. A plain-string title stays a
plain string. The inspector's title field edits that same entry through the same
read/write pair; editing every locale from one surface is still an open question.
