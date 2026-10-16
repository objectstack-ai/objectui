---
'@object-ui/fields': patch
'@object-ui/app-shell': patch
---

Action-param and bulk-action dialogs draw `date` and `datetime` params with the platform date picker, the same face record forms draw since objectui#12622 (objectui#12642).

The native input took its placeholder and digit order from the machine's locale, not the console's. Now one field type has one face in forms and dialogs.

- **Where it applies.** Everything that resolves a field widget through `getLazyFieldWidget` or `registerField` / `registerAllFields`: the record form, `ActionParamDialog`, the grid's `BulkActionDialog`, and the console's form page. The detail inline editor (`InlineFieldInput`) and the list filters keep the native input.
- **The value written is unchanged.** A `date` param writes `YYYY-MM-DD` and a `datetime` param writes an ISO instant, as the native inputs did.
- **The Action designer's preview** draws a date-picker shape for `date` / `datetime` params, matching the dialog.
- **No public surface changes.** No type, prop, export or language-pack key is added or removed (Clause-②: no). `getLazyFieldWidget('date' | 'datetime')` returns another component with the same props.
