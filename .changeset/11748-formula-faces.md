---
'@object-ui/fields': patch
'@object-ui/types': patch
---

A formula reads the same in a read-only form and in a table cell (objectui#11748).

The read-only form face (`FormulaField`) and the table cell (`FormulaCellRenderer`) formatted a formula's value separately, so one stored value read two ways. The form printed a number raw or with two fixed decimals, in monospace (`200000`, `200000.00`), where the cell read `200,000`. The cell printed a declared boolean or date raw (`true`, `2026-07-04`), where the form read `Yes` and `Jul 4`.

Both faces now use one rule. The type is the field's declared `returnType`. With no `returnType`, a JS number is a number and any other value is text. No type is inferred from the expression. Each type is drawn the way the matching field type draws it:

- **number**: formatted in the viewer's locale, at the width a declared `scale` gives, as on a number field. `200000` reads `200,000` in en-US and zh-CN in both faces; two fixed decimals are no longer added.
- **boolean**: the language's Yes / No word in both faces (`是` / `否` in zh-CN). The cell no longer prints `true`. Only a JS boolean counts, as on a boolean field. A non-boolean value draws the empty-value mark, where the form used to read `Yes` for the string `'false'`.
- **date**: the date field's read-only face, `formatDate`'s default (`Jul 4`, or `Jul 4, 2020` outside the current year), in both faces. The cell does not use the date cell's relative face (`Today`, `2 days ago`), because the form has no relative face to match. An unparsable value draws the empty-value mark.
- **text**: the value in monospace, as before. The form now prints it the way the cell does: an empty string or empty list draws the empty-value mark, where the form drew a blank, and an expanded record reads its name, where the form printed `[object Object]`.

objectui#11683 changed the cell for numbers only and left a declared boolean or date as it was. This change converts both.

No export, prop or language-pack key is added. The `returnType` doc comments in `@object-ui/types`, on `FormulaFieldMetadata` and on the form field, now describe this rule for both faces in place of the retired two-decimal face.
