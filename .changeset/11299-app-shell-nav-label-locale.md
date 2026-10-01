---
'@object-ui/app-shell': patch
---

fix(app-shell): a navigation label written as an inline locale map shows in the viewer's language across the console (objectui#11299)

An app navigation entry whose `label` is an inline locale map
(`{ en: 'Accounts', 'zh-CN': '客户' }`) showed its `en` text to every viewer. The
console now passes its active UI language — the one the sidebar already shows area
labels in — to every surface that names a navigation entry: the sidebar (app and home
navigation), the `nav:menu` page block, the command palette and the search results
page. A viewer reading Chinese sees `客户`, and the palette and search match it by that
text. Plain-string labels and unlabelled entries are unchanged.
