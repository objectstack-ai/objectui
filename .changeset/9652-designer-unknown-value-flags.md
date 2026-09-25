---
'@object-ui/app-shell': patch
---

fix(app-shell): the designer's unknown-value flags read in the designer's locale

When a designer picker holds a stored value its option list does not offer, it
still shows that value, flagged with the reason: `(not found)`, `(not in object)`
or `(deprecated)`. Those flags were English template literals written at each call
site, so a zh-CN author read untranslated English on an otherwise Chinese
inspector, on the one marker whose job is to explain why a value looks wrong.

Every flag now comes from the designer's own string catalogue. `(not in object)`
uses the existing `engine.form.notInObject` row, and two new rows sit beside it,
`engine.form.notFound` and `engine.form.deprecated`, each in en and zh. The value
and its flag are joined by one new `engine.form.flaggedValue` template, so the
locale decides their order and the gap between them: zh sets no space before the
full-width bracket its flags open with. The en-US text is unchanged.

The sites covered are the view-column field picker, the view-type picker, the
flow-node select field, the select cells of a flow node's object-list editor, and
the default flag `InspectorSelectField` shows at every call site that words none
of its own. That default has no `locale` prop to read, so it follows the
designer's active language through `useMetadataLocale()`, as the designer's other
shared editors already do.
