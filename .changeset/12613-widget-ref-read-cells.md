---
'@object-ui/fields': minor
'@object-ui/plugin-grid': minor
---

A list names what an `object-ref` or `recipient-picker` field references, instead of printing its api name (objectui#12613). The Sharing Rules list read `crm_account` and `sales_manager` where the edit form reads "Account" and "Sales Manager".

- **The declared `widget` picks the read cell.** `resolveCellRendererType` now promotes a textual field declaring `widget: 'object-ref'` or `widget: 'recipient-picker'` to a read cell registered under the widget's key, the same second step a `format` hint takes. A widget with no read cell of its own (`filter-condition`, `position-ref`, …) still draws as its `type`, and nothing is keyed on an object or field name.
- **`object-ref`** draws the object's label, translated through the app bundle like every other object label, with the picker's `Label (name)` spelling as its tooltip. The catalog is the one `ObjectRefField` lists its options from, read once per data source for the whole list.
- **`recipient-picker`** draws the label of the user, team, business unit, position or user column the stored value names, from the very list the picker offers: its candidate query for the record kinds, the metadata store for positions, and the shared object's schema for the `field` kind. Each list is read once per data source for the whole page.
- **A value nothing names** (a deleted record, a renamed object, a read the viewer is refused) draws as the raw stored value, muted, with the shared unresolved-reference mark. It is never blank.
- **`CellRendererProps` gains one optional member, `dependentValues`**: the row's values, the cell-side counterpart of the edit widget's `dependentValues`. The recipient cell reads the row's `recipient_type` from it. `ObjectGrid` passes the row on every column path; a call site that passes nothing draws the stored text exactly as before.

Stored values do not change. The edit widgets list and store exactly what they did: their catalog read and kind table moved into modules both faces share.
