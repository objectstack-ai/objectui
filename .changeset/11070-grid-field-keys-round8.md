---
'@object-ui/types': minor
'@object-ui/fields': minor
'@object-ui/plugin-form': patch
---

The grid field reads each field-level key under the one spelling `GridFieldMetadata` declares (objectui#11070, round 8).

`GridFieldMetadata` declared `allow_reorder` and the docs taught it, while `GridField` read `reorderable`, so `allow_reorder: false` still drew a drag handle on every row. The widget also read its footer total under three spellings, and read four keys that no face declared. Each key now has one spelling, and that spelling is declared and read:

- **Reorder (`@object-ui/fields`).** `GridField` reads `allow_reorder`. `allow_reorder: false` removes the drag handles. The undeclared `reorderable` is no longer read; this round's census found no writer of it in either repository.
- **Total (`@object-ui/types`, `@object-ui/fields`).** `GridFieldMetadata` declares `total_field`, the one spelling the grid reads. It names the CHILD column summed into the footer, which is the spec's `amountField` (`inlineAmountField` on a `master_detail` field, `subforms[].amountField` on a form view). It is not the spec's `totalField`, the parent field a master-detail save writes the sum to. The `amount_field` and `amountField` reads beside it are retired: the same census found nothing writing either into the grid's config.
- **`add_label` (`@object-ui/types`).** Declared. `MasterDetailForm` writes it from a detail's `addLabel`, and it labels the grid's Add button.
- **`allow_duplicate` and `show_line_numbers` (`@object-ui/fields`)** are retired under ADR-0049. No face declared either, and the census found no producer of either. The behaviour their defaults gave stays: each row offers a duplicate action whenever rows can be added, and the line-number column always shows.
- **`sort_field` is unchanged.** `MasterDetailForm` still writes it from a detail's `sortField`, which is derived from the child object when not authored. The spec declares no inline sort-field key, so it stays read and undeclared, named in one place in `GridField`.
- **`record:line_items` total (`@object-ui/plugin-form`).** The panel shows its grid's footer total whenever `amountField` names the column to sum, the way `MasterDetailForm` already did. It used to show it only when `totalField` was also set.

`GridField` now types its config reads as `GridFieldMetadata`, so a read of a key the type does not declare fails to compile.

**Clause-②: yes (narrowing).** The published `GridFieldMetadata` face widens by two optional members, `total_field` and `add_label`. What the grid honours narrows: five keys it used to read are no longer read.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

- **Rendering.** A grid field written with `reorderable`, `amount_field`, `amountField`, `allow_duplicate` or `show_line_numbers` renders as if that key were absent. Fix: write `allow_reorder: false` to turn off drag reordering, and `total_field` to name the summed column. To turn off the duplicate action, turn off adding with `allow_add: false`; there is no switch for the line-number column.
- **Behaviour.** `allow_reorder: false` now removes the drag handles; before, it was ignored. A `record:line_items` panel with `amountField` and no `totalField` now shows the footer total of that column.
- **TypeScript.** A `GridFieldMetadata` literal carrying any of the five retired keys was already a compile error, and still is.

**Note, 2026-10-01 (objectui#11070 round 9, shipping in this same release).**
The `sort_field` bullet above no longer holds. `GridFieldMetadata` now declares
`sort_field`, so `GridField` reads no undeclared key, and a detail's `sortField`
is no longer authored: `MasterDetailDetailConfig` has no such member, and
`MasterDetailForm` hands the grid the sort field it derives from the child
object. See `11070-grid-sort-field-round9`.
