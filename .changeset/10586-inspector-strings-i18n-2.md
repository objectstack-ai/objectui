---
'@object-ui/app-shell': patch
---

fix(app-shell): the hook and action inspectors, and the shared inspector defaults, read their words in the designer's locale (objectui#10586)

`HookDefaultInspector` and `ActionDefaultInspector` rendered their section
titles, field labels, placeholders, hints, option labels and accessible names
as English literals. `InspectorComboField` and `_shared.tsx` fell back to
English defaults wherever a caller passed none: the combo's placeholder,
search box, empty state, loading text and "Use" row, and the shell's close
label, the reorder pair's names and the roster-failure notice. So a zh-CN
author read English inside an otherwise Chinese designer.

The two inspectors now read the designer's own string catalogue under
`engine.inspector.hook.*` and `engine.inspector.action.*`, each row in en and
zh, from the `locale` their host already passes. The combo's words are new
`engine.inspector.combo.*` rows. The other defaults reuse existing rows
(`engine.form.selectEllipsis`, `engine.close`, `engine.inspector.reorder.*`,
`engine.form.optionsLoadFailedTitle`), and they follow the active language
through `useMetadataLocale()`. A label the caller passes still wins. The en-US
text is unchanged. Stored values, lifecycle event names, HTTP methods, code
samples and sample values are not words and stay as they were.
