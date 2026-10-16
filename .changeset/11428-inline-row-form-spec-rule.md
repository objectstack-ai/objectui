---
'@object-ui/plugin-form': patch
---

The per-row expand form of an inline master-detail collection now takes both of its rules from `@objectstack/spec` (objectui#11428), as the collection's grid columns already do. `deriveFormFields`, the form's fields when its author listed none, returns the spec's `deriveInlineRowFormFields` answer, and `MasterDetailForm` offers a row the form when the spec's `isInlineRowFormOffered` says so. The rules are the spec's now, so objectstack's `field-no-consumers` lint credits exactly the fields this form draws.

The output does not change. `deriveFormFields` keeps its signature and returns the same names in the same order, and a row is offered the form exactly when it was before: always in `form` mode, and in `grid` mode only when the form has more fields than the grid has columns. How each named field renders is still decided here.

`@object-ui/plugin-form` raises its `@objectstack/spec` floor from `^17.6.0` to `^17.7.0`, because its published entry now imports `deriveInlineRowFormFields` and `isInlineRowFormOffered`, which the spec first exports in 17.7.0.
