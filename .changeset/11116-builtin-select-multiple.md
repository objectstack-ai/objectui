---
'@object-ui/components': patch
---

A hand-authored form field `{ type: 'select', multiple: true }` now renders the multi-value select and submits an array (objectui#11116). The form renderer's built-in `select` branch read `multiple` nowhere, so the field drew a single-value combobox and collected one value; the catalog's `fields-select/multi-select` example demonstrated exactly that. The hand-authored spelling is now routed to the same registered `field:multiselect` widget the object-bound path already reaches through `mapFieldTypeToFormType`, including its group label association. A `select` without `multiple` is unchanged. With `@object-ui/fields` not registered, the field renders what an authored `field:multiselect` renders in that host instead of the single-value control.
