---
'@object-ui/app-shell': patch
---

fix(app-shell): three designer inspectors read their words in the designer's locale (objectui#10586)

`DatasetDefaultInspector`, `FlowReferenceField` (with the `ReferenceCombobox` it
wraps) and `ConditionBuilder` rendered their section titles, field labels,
placeholders, hints, option labels and accessible names as English literals, so a
zh-CN author read an English form inside an otherwise Chinese designer.

Those strings now come from the designer's own string catalogue, under
`engine.inspector.dataset.*`, `engine.inspector.reference.*` and
`engine.inspector.condition.*`, plus the existing `engine.form.add` and
`engine.form.searchFields`, each with an en and a zh row. The dataset inspector
reads the `locale` its host already passes; the other two follow the active
language through `useMetadataLocale()`. The en-US text is unchanged. Stored
values, the `≥` / `≤` operator symbols, currency codes and decimal digits are not
words and stay as they were.
