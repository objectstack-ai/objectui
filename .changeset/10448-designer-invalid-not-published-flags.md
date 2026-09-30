---
'@object-ui/app-shell': patch
---

fix(app-shell): two more designer unknown-value flags read in the designer's locale

Two designer pickers still wrote their unknown-value flag as an English template
literal, so a zh-CN author read untranslated English on an otherwise Chinese
inspector: the approver membership-tier select flagged a stored tier outside its
vocabulary `(invalid)`, and the Hook inspector's object picker flagged a selected
object the live catalog does not list `(not published)`.

Both flags now come from the designer's string catalogue through the same
`engine.form.flaggedValue` template the other unknown-value flags use. Two rows
sit beside `engine.form.notFound` and `engine.form.deprecated`:
`engine.form.invalid` and `engine.form.notPublished`, each in en and zh. zh shows
the value followed directly by its full-width-bracketed flag. The en-US text is
unchanged.

The membership-tier select has no `locale` prop, so it follows the designer's
active language through `useMetadataLocale()`. The Hook inspector uses the
`locale` it already receives.
