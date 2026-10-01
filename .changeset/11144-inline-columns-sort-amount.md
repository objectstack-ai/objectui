---
'@object-ui/plugin-form': patch
---

fix(plugin-form): a master-detail child with authored inline columns derives its sort field and amount field, so line order persists and the total shows (objectui#11144)

A master-detail child whose relationship field declares `inlineColumns` lost two
things in the parent's form. A line created or dragged into a new order carried no
`position`, so the order was gone after save. And unless the relationship also
declared `inlineAmountField`, no running total rendered: neither the grid's own
total nor the Subtotal / Tax / Total stack.

Such a detail reaches the form with a relationship field and an authored column
set, and that path only filled in the column types from the child object. The sort
field (a `position`-, `sort_order`- or similarly named field on the child) and the
amount field were picked only for details without authored columns, and nothing
else supplies them: the spec has no inline sort-field key.

A detail with authored columns now takes both from the same derivation as every
other detail, while keeping its own columns, order and labels. The amount field is
picked from the authored columns by the rule a derived grid already uses. An
authored `inlineAmountField` (or a detail's own `amountField` / `sortField`) still
wins over the derived one.

**Note, 2026-10-01 (objectui#11070 round 9, shipping in this same release).**
A detail's own `sortField` no longer wins, because it is no longer read:
objectui#11070 round 9 retired that member of `MasterDetailDetailConfig`. The
derived sort field is the only one. An authored `inlineAmountField` (or a
detail's own `amountField`) still wins over the derived amount field.
