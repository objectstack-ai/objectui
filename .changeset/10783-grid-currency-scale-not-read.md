---
'@object-ui/fields': minor
'@object-ui/plugin-form': patch
---

fix(fields): a currency grid column's width is its currency's minor unit, never an authored `scale`; a hydrated currency column's `scale` is reported (objectui#10783)

The line-item grid (`GridField` / `LineItemsField`) no longer reads `scale` on a
`currency` column. The currency's ISO 4217 minor unit decides both the width a
computed amount is stored at and the places the cell shows: whole yen for JPY,
two places for USD, three for KWD, whatever `scale` the column carries.
`@objectstack/spec` 17.5.0 refuses `scale` on an inline grid column that
declares `type: 'currency'` (ruling B on objectstack-ai/objectstack#19629,
ruling 乙 on objectstack-ai/objectstack#19910), and the grid now matches it.
`scale` on a `number` column is unchanged.

A column that declares no `type` and takes `currency` from its child field, such
as `inlineColumns: [{ name: 'amount', scale: 2 }]` over a currency `amount`
field, still passes the spec, which cannot see the child field's type. The
master-detail form's column hydration now reports such a `scale` on the console,
once per column, naming the column and the child object, instead of leaving it
unread in silence. It reports a declared currency column that carries `scale`
too, because a form view's `subforms[].columns` is not judged by the spec. The
column still renders, at its currency's minor unit; delete the key.

**Behaviour change** for a currency column with an authored `scale`: a computed
amount is stored and shown at the currency's minor unit instead of at that
`scale`. A JPY tenant's column with `scale: 2` used to show `¥1,234.57` and now
shows `¥1,235`.
