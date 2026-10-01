---
'@object-ui/types': minor
'@object-ui/plugin-form': minor
'@object-ui/fields': patch
---

The grid field's `sort_field` is declared, and a master-detail detail's sort field is derived only (objectui#11070, round 9).

`GridField` stamps each row with its index in the field `sort_field` names, on every change, so the order a drag-reorder leaves is saved with the rows. It read that key while no face declared it. Its one producer is `MasterDetailForm`, which hands the grid the sort field `deriveDetail` picks from the child object: the first of its fields named `position`, `sort_order`, `sequence`, `line_no`, `line_number` or `sort`. A detail could also override that pick with an authored `sortField`, which nothing wrote in either repository and no spec key carries.

- **`sort_field` is declared (`@object-ui/types`).** `GridFieldMetadata` declares `sort_field?: string`, documented as the CHILD field stamped with each row's index. `GridField` now reads its config as `GridFieldMetadata` alone, so every key it reads is declared there (`@object-ui/fields`; no runtime change).
- **The authored override is retired (`@object-ui/plugin-form`).** `MasterDetailDetailConfig` no longer has a `sortField` member, and `MasterDetailForm` no longer reads one. The sort field the grid receives is the derived one, carried on the form's internal per-detail state.

**Clause-②: yes (narrowing).** The published `GridFieldMetadata` face widens by one optional member. The published `MasterDetailDetailConfig` face narrows by one member, and what `MasterDetailForm` honours narrows with it.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

- **TypeScript.** A `MasterDetailDetailConfig` literal that writes `sortField` is a compile error. Fix: delete it. The sort field comes from the child object; name the child's position field `position` (or another of the names above) so the derivation finds it.
- **Rendering.** A detail written with `sortField` (through a cast, or in a document the compiler never saw) renders as if the key were absent. On a detail the form derives, the grid stamps the child's sort-named field; on a fully configured detail (relationship field set and every column typed), which loads no child schema, the grid stamps none.
