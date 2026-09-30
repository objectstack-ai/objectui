---
'@object-ui/app-shell': patch
---

fix(app-shell): the admin previews and the CEL lint advisories read the designer locale (objectui#10862, slice 2)

Under zh-CN these designer surfaces rendered their own words in English beside
Chinese text:

- the app, book, datasource, email template, permission set, position and
  translation previews: their empty prompts, section and column headings,
  pills, badges, legends, notes, toolbar links and their tooltips, the
  permission set's sanity-check warnings, the email template's envelope
  labels and variable placeholders, and the translation bundle's category
  names;
- the two advisories the CEL lint writes itself beneath the CEL editors: the
  wrong-layer `data.*` root on a record-scope expression, and an RLS `USING`
  read filter that cannot be pushed down to the query.

Each new en row is the English the literal carried, so en renders unchanged.
Author data (labels, names, doc names, config keys and values, variable
names, a translation bundle's own locale), identifiers (navigation kinds, tab
visibility values, access-scope tokens, the C / R / U / D column letters,
"SSL"), the expression engine's own messages and `@objectstack/lint`'s
field-rule message show as written in every locale.

This is slice 2 of objectui#10862 (the admin previews). The object / data
previews and the preview error-boundary hints remain for slice 3.
