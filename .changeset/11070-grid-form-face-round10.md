---
'@object-ui/types': minor
---

A form field of `type: 'grid'` declares the grid widget's field-level keys (objectui#11070, round 10).

A `form`'s `fields[]` entry of `type: 'grid'` is the authored path to the `grid` widget, which reads its field-level keys off that entry. `GridFieldMetadata` declares them and the grid docs teach them, but the form-field face declared none of them, so the strict authoring face (`StrictAnyComponentSchema`) refused each one by name on a form field while the widget read it.

- **`FormField` (TypeScript)** declares `min_rows`, `max_rows`, `allow_add`, `allow_delete`, `allow_reorder`, `total_field`, `add_label` and `sort_field`, each as `GridFieldMetadata`'s own member by reference (`GridFieldMetadata['min_rows']`, and so on), so the two faces cannot drift. Before, each one resolved to the interface's `[key: string]: any` index signature.
- **`FormFieldSchema` (the zod mirror)** declares the same eight keys with the same value types: numbers for the two row limits, booleans for the three switches, and strings for the total column, the Add label and the sort field. Each `.describe()` says that only the `grid` widget reads it.
- On any other field type the keys are accepted and read by nothing, as `columns` already was.

**Clause-②: yes (widening).** `FormFieldSchema`, a published accept set, accepts eight more keys on a form field, so the strict authoring face now accepts a grid entry that writes them. The tolerant face narrows on their values: `FormFieldSchema` strips an undeclared key, so before this change a wrong-typed value (for example `allow_add: "false"` or `min_rows: "1"`) was dropped from the parsed field in silence, and now it is refused.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

- **Validation.** A form field whose grid key holds a value of the wrong type, which the tolerant face (`safeValidateSchema`, and so `objectui validate`) accepted by stripping the key, is refused. Fix: write the key with its declared type (`allow_add: false`, `min_rows: 1`).
- **TypeScript.** A `FormField` literal that writes one of the eight keys with the wrong type is a compile error; before, the index signature accepted any value.

Rendering does not change: the `grid` widget reads the same keys as before.
