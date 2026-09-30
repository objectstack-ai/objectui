---
'@object-ui/fields': patch
---

fix(fields): a multi-value select shows its placeholder while nothing is selected

`MultiSelectField` read no `placeholder`. A `select` field declared `multiple: true`, or a `multiselect` field, silently dropped the key that the single-value select honours. The catalog's `fields-select/multi-select` example authors `"placeholder": "Select tags..."`, and it showed nothing.

The editable chip row now shows the author's `placeholder` as muted text while the value is empty, and hides it after the first pick. The key is read from the field metadata, the same place the single-value select reads it. An empty string counts as none. A field with no `placeholder` renders the same markup as before, with no default text, because every option is already on screen as a chip. The host label still names the group, and the placeholder never becomes its accessible name. A readonly empty field still renders the "No value" mark.
