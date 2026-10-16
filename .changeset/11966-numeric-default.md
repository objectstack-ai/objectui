---
'@object-ui/app-shell': patch
---

Studio's field inspector gives `rating`, `slider` and `progress` fields a number *Default value* control, so the default saves as a number (objectui#11966).

These three types store a number, and `@objectstack/spec`'s `FieldSchema` refuses a literal default that is not one. The inspector offered them a text box instead, so a default typed there (`3`) saved as the string `'3'` and was refused with "expected number, received string". They now get the same number control as `number`, `currency` and `percent` fields: the inspector gives it to every type in the spec's numeric value class (`NUMERIC_VALUE_TYPES`), except the computed `summary`, which still has no default control.

A default already stored as a string is not converted. It stays on the field through other edits, and the number box shows it empty. Typing a number replaces it.

The control takes any number. It is not limited to the field's `min` / `max`, and the spec does not check a default against them either.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
