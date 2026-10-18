---
'@object-ui/app-shell': patch
---

Studio's field inspector offers no *Default value* control on a `record`, `location` or `address` field, as it offers none on a `composite` or `repeater` field (objectui#11947).

These types store an object, and the spec judges a field's literal default against its stored value. The inspector showed a text box for their default, so typing in it wrote a string, and the object's save was refused ("expected record, received string"). No control in the inspector can write an object, so these types now show no default control. A `text` field keeps its text box, and the other types are unchanged.

A default such a field already carries, written in code, stays on the field. Editing the field's other settings in the inspector saves it unchanged.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
