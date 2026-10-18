---
'@object-ui/app-shell': patch
---

Studio's field inspector says when a translation overrides the label being edited (objectui#11782).

The inspector's Label input edits a field's source label. The Data pillar's grid headers and form canvas show the label the app's translation bundle gives the field for the active language, so a translated field read one way on the canvas and another in the input, with nothing explaining why: the showcase's `showcase_account.tax_id` showed "Tax ID" on the canvas and "Tax ID (EIN)" in the input.

A muted line under the Label input now reads, for example, `Shown as “Tax ID” in en: the app’s translation bundle overrides this label.` The label comes from the same resolver the grid and the canvas use (`useSafeFieldLabel().fieldLabel` from `@object-ui/i18n`), and the language named is the one that resolver reads, so a `ja` session is told `ja` even though the designer's own strings are English. The line shows only when the translated label differs from the input's current value: a field with no translation, or one whose translation equals the label being edited, shows nothing. The input still edits and saves the source label exactly as before, and how translations resolve is unchanged.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).
