---
'@object-ui/plugin-designer': patch
---

The designer forms pick with the shared `Select`, the control the rest of the console picks with (objectui#11865, the designer forms' part of that card): `FieldDesigner`'s type filter, `DataModelDesigner`'s field-type picker on each field row, `BrandingEditor`'s font family and `AppCreationWizard`'s template.

The four pickers were browser-native selects, so they looked and behaved differently from the console's other dropdowns. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour. The type filter keeps its category headings (Text, Number, Date & Time, Choice, Relation, Advanced) as groups of the dropdown.

What they write is unchanged. Each option gives the form the same value as before: "All Types" still clears the type filter, "Default (System)" still clears the branding's `fontFamily`, and "None" still sets the draft's `template` to an empty string. Re-picking the current option writes nothing. The font family and template pickers keep the accessible name their label gave the native select ("Font Family", "Template") and show read-only mode as disabled. The type filter stays enabled in read-only mode, as before, and a read-only data model still shows each field's type as text. On a data model entity card, a click on the type picker still does not select the card, and Delete or Escape on it still does not act on the canvas.

One display change: a value none of a picker's options carries now shows as itself. The native select showed its first option instead (`text` for a field type, "Default (System)" for a font, "None" for a template), which is not what the form holds.

**Clause-②: no.** No published face moves: the package entry exports the same names, the four components take the same props, and no i18n key is added. What moves is the four controls' own markup, described above.
