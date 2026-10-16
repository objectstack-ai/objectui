---
'@object-ui/fields': minor
'@object-ui/plugin-grid': minor
'@object-ui/app-shell': minor
---

A list names what an `object-ref` or `recipient-picker` field references, instead of printing its api name (objectui#12613). The Sharing Rules list read `crm_account` and `sales_manager` where the edit form reads "Account" and "Sales Manager".

- **The declared `widget` picks the read cell (`@object-ui/fields`).** `resolveCellRendererType` now promotes a textual field declaring `widget: 'object-ref'` or `widget: 'recipient-picker'` to a cell key of that name, the same second step a `format` hint takes. Both keys are registered with the stored text as their default face, as `RECORD_POINTER_CARD_TYPE` is. A widget with no read cell of its own (`filter-condition`, `position-ref`, …) still draws as its `type`, and nothing is keyed on an object or field name.
- **`CellRendererProps` gains one optional member, `dependentValues`**: the row's values, the cell-side counterpart of the edit widget's `dependentValues`. `ObjectGrid` (`@object-ui/plugin-grid`) passes the row, and the widget hint, on every column path. A call site that passes nothing draws the stored text exactly as before.
- **The edit widgets' reads are published** so a host face names a value from the very lists the widgets offer: `loadObjectCatalog`, `objectRefOptionLabel`, `RECIPIENT_RECORD_KINDS`, `RECIPIENT_REGISTRY_KINDS`, `FIELD_RECIPIENT_TYPE`, `loadRecipientCandidates` and `recipientCandidateLabel`, plus the shared `UnresolvedReferenceMark` drawing. `ObjectRefField` and `RecipientPickerField` read through them and list and store exactly what they did.
- **The console's faces (`@object-ui/app-shell`)** register under the two keys and load lazily, on the first cell that draws one, so a page without such a column pays nothing on load. `object-ref` draws the object's label, translated through the app bundle like every other object label, with the picker's `Label (name)` spelling as its tooltip. `recipient-picker` draws the label of the user, team, business unit, position or user column the stored value names, from the list the picker offers: its candidate query for the record kinds, the metadata store for positions, the shared object's schema for the `field` kind. Each list is read once per data source for the whole page.
- **A value nothing names** (a deleted record, a renamed object, a read the viewer is refused) draws as the raw stored value, muted, with the shared unresolved-reference mark. It is never blank.

Stored values do not change.
